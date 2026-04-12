import { GoogleGenerativeAI } from "@google/generative-ai";
import AppError from "../utils/AppError.js";
import { ALLOWED_SPECIALTIES } from "../constants/specialties.js";
import { getConversationHistory, saveConversationTurn } from "./history.service.js";

let geminiModel = null;

const SYSTEM_PROMPT = [
  "You are a healthcare triage assistant.",
  "Give preliminary guidance only and do not provide a diagnosis.",
  "Always recommend seeing a licensed doctor.",
  "Always include a disclaimer that this is not a diagnostic service.",
  `You must suggest exactly one specialty from this list only: ${ALLOWED_SPECIALTIES.join(", ")}.`,
  "Respond with strict JSON only using this shape:",
  '{"reply":"...","suggestedSpecialty":"..."}'
].join("\n");

const getGeminiModel = () => {
  if (geminiModel) {
    return geminiModel;
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new AppError("GEMINI_API_KEY is missing", 500, "GEMINI_API_KEY_MISSING");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  geminiModel = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json"
    }
  });

  return geminiModel;
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

  let rawResponse = "";

  try {
    const result = await getGeminiModel().generateContent(prompt);
    rawResponse = result.response.text().trim();
  } catch (error) {
    throw new AppError(
      "Failed to reach Gemini API",
      502,
      "GEMINI_UPSTREAM_ERROR",
      error.message || null
    );
  }

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
