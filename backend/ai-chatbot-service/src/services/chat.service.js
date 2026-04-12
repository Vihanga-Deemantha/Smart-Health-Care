import { GoogleGenerativeAI } from "@google/generative-ai";
import AppError from "../utils/AppError.js";
import { ALLOWED_SPECIALTIES } from "../constants/specialties.js";
import { getConversationHistory, saveConversationTurn } from "./history.service.js";

let geminiClient = null;
const geminiModelCache = new Map();

const DEFAULT_GEMINI_MODEL = "gemini-1.5-flash";
const TRANSIENT_GEMINI_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

const SYSTEM_PROMPT = [
  "You are a healthcare triage assistant.",
  "Give preliminary guidance only and do not provide a diagnosis.",
  "Always recommend seeing a licensed doctor.",
  "Always include a disclaimer that this is not a diagnostic service.",
  `You must suggest exactly one specialty from this list only: ${ALLOWED_SPECIALTIES.join(", ")}.`,
  "Respond with strict JSON only using this shape:",
  '{"reply":"...","suggestedSpecialty":"..."}'
].join("\n");

const parsePositiveInt = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return fallback;
  }

  return parsed;
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getGeminiErrorMessage = (error) => String(error?.message || "").trim();

const getGeminiStatusCode = (error) => {
  if (Number.isInteger(error?.status)) {
    return error.status;
  }

  if (Number.isInteger(error?.statusCode)) {
    return error.statusCode;
  }

  const message = getGeminiErrorMessage(error);
  const bracketMatch = message.match(/\[(\d{3})\s[^\]]+\]/);

  if (bracketMatch) {
    return Number(bracketMatch[1]);
  }

  return null;
};

const isGeminiKeyBlockedError = (statusCode, message) => {
  return (
    statusCode === 403 &&
    /api key was reported as leaked|reported as leaked/i.test(message)
  );
};

const isGeminiKeyUnauthorizedError = (statusCode, message) => {
  const keyErrorInMessage = /api key|api_key|unauthorized|forbidden|permission denied/i.test(message);

  if (statusCode === 400 && /api key not valid|invalid api key|key not valid/i.test(message)) {
    return true;
  }

  return (
    (statusCode === 401 || statusCode === 403) &&
    keyErrorInMessage
  );
};

const isGeminiModelUnavailableError = (statusCode, message) => {
  if (/api key not valid|invalid api key|api key/i.test(message)) {
    return false;
  }

  return (
    (statusCode === 400 || statusCode === 404) &&
    /model|not found|unknown model|unsupported/i.test(message)
  );
};

const isTransientGeminiError = (statusCode, message) => {
  if (statusCode && TRANSIENT_GEMINI_STATUS_CODES.has(statusCode)) {
    return true;
  }

  return /timeout|timed out|temporar|overloaded|internal error|try again/i.test(message);
};

const toGeminiAppError = (error, modelNames = []) => {
  const message = getGeminiErrorMessage(error);
  const statusCode = getGeminiStatusCode(error);

  if (isGeminiKeyBlockedError(statusCode, message)) {
    return new AppError(
      "Gemini API key is blocked because it was reported as leaked. Create a new key and update GEMINI_API_KEY.",
      503,
      "GEMINI_API_KEY_BLOCKED",
      message || null
    );
  }

  if (isGeminiKeyUnauthorizedError(statusCode, message)) {
    return new AppError(
      "Gemini API key is invalid or unauthorized. Update GEMINI_API_KEY and restart the AI chatbot service.",
      503,
      "GEMINI_API_KEY_INVALID",
      message || null
    );
  }

  if (statusCode === 429) {
    return new AppError(
      "Gemini API rate limit reached. Please retry shortly.",
      429,
      "GEMINI_RATE_LIMITED",
      message || null
    );
  }

  if (isGeminiModelUnavailableError(statusCode, message)) {
    return new AppError(
      `Configured Gemini model is unavailable. Checked models: ${modelNames.join(", ") || "none"}.`,
      503,
      "GEMINI_MODEL_UNAVAILABLE",
      message || null
    );
  }

  return new AppError(
    "Failed to reach Gemini API",
    502,
    "GEMINI_UPSTREAM_ERROR",
    message || null
  );
};

const getGeminiClient = () => {
  if (geminiClient) {
    return geminiClient;
  }

  const apiKey = String(process.env.GEMINI_API_KEY || "").trim();

  if (!apiKey || apiKey === "change-me") {
    throw new AppError(
      "GEMINI_API_KEY is missing. Generate a valid key and set GEMINI_API_KEY.",
      500,
      "GEMINI_API_KEY_MISSING"
    );
  }

  geminiClient = new GoogleGenerativeAI(apiKey);
  return geminiClient;
};

const getModelCandidates = () => {
  const primary = String(process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL).trim();
  const fromEnv = String(process.env.GEMINI_FALLBACK_MODELS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return [...new Set([primary, ...fromEnv, DEFAULT_GEMINI_MODEL].filter(Boolean))];
};

const getGeminiModel = (modelName) => {
  if (geminiModelCache.has(modelName)) {
    return geminiModelCache.get(modelName);
  }

  const model = getGeminiClient().getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.2
    }
  });

  geminiModelCache.set(modelName, model);
  return model;
};

const generateGeminiText = async (prompt) => {
  const modelNames = getModelCandidates();
  const retriesPerModel = parsePositiveInt(process.env.GEMINI_MAX_RETRIES, 2);
  let lastError = null;

  for (const modelName of modelNames) {
    const model = getGeminiModel(modelName);

    for (let attempt = 1; attempt <= retriesPerModel + 1; attempt += 1) {
      try {
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
      } catch (error) {
        const statusCode = getGeminiStatusCode(error);
        const message = getGeminiErrorMessage(error);
        lastError = error;

        if (
          isGeminiKeyBlockedError(statusCode, message) ||
          isGeminiKeyUnauthorizedError(statusCode, message)
        ) {
          throw toGeminiAppError(error, modelNames);
        }

        if (attempt <= retriesPerModel && isTransientGeminiError(statusCode, message)) {
          const delayMs = Math.min(250 * 2 ** (attempt - 1), 2000);
          await wait(delayMs);
          continue;
        }

        if (isGeminiModelUnavailableError(statusCode, message)) {
          break;
        }

        throw toGeminiAppError(error, modelNames);
      }
    }
  }

  throw toGeminiAppError(lastError, getModelCandidates());
};

const normalizeSpecialty = (value) => {
  if (!value || typeof value !== "string") {
    return "General Physician";
  }

  const direct = ALLOWED_SPECIALTIES.find((item) => item.toLowerCase() === value.toLowerCase());

  if (direct) {
    return direct;
  }

  const partial = ALLOWED_SPECIALTIES.find((item) => {
    const current = item.toLowerCase();
    const incoming = value.toLowerCase();
    return current.includes(incoming) || incoming.includes(current);
  });

  return partial || "General Physician";
};

const parseJsonOutput = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new AppError("Gemini response format is invalid", 502, "INVALID_AI_RESPONSE");
    }

    try {
      return JSON.parse(match[0]);
    } catch {
      throw new AppError("Gemini response format is invalid", 502, "INVALID_AI_RESPONSE");
    }
  }
};

const ensureDisclaimer = (reply) => {
  const safeReply = String(reply || "").trim();

  if (!safeReply) {
    return "I can share only preliminary guidance. This is not a diagnosis. Please consult a licensed doctor as soon as possible.";
  }

  const lower = safeReply.toLowerCase();
  const hasDisclaimer =
    lower.includes("not a diagnosis") ||
    lower.includes("not diagnostic") ||
    lower.includes("consult") ||
    lower.includes("licensed doctor");

  if (hasDisclaimer) {
    return safeReply;
  }

  return `${safeReply}\n\nDisclaimer: This is AI-assisted preliminary guidance, not a diagnosis. Please consult a licensed doctor.`;
};

const buildPrompt = ({ history, latestMessage }) => {
  const contextText = history.length
    ? history.map((entry) => `${entry.role === "assistant" ? "Assistant" : "Patient"}: ${entry.content}`).join("\n")
    : "No prior conversation context.";

  return [
    SYSTEM_PROMPT,
    "",
    "Conversation context (last up to 6 messages):",
    contextText,
    "",
    `Latest patient message: ${latestMessage}`,
    "",
    "Return only JSON."
  ].join("\n");
};

export const generateChatReply = async ({ patientId, message }) => {
  const trimmedMessage = String(message || "").trim();

  if (!trimmedMessage) {
    throw new AppError("Message is required", 400, "MESSAGE_REQUIRED");
  }

  const history = getConversationHistory(patientId);
  const prompt = buildPrompt({ history, latestMessage: trimmedMessage });

  const rawResponse = await generateGeminiText(prompt);

  const parsed = parseJsonOutput(rawResponse);
  const reply = ensureDisclaimer(parsed.reply);
  const suggestedSpecialty = normalizeSpecialty(parsed.suggestedSpecialty);

  saveConversationTurn({
    patientId,
    userMessage: trimmedMessage,
    assistantMessage: reply,
    suggestedSpecialty
  });

  return {
    reply,
    suggestedSpecialty
  };
};
