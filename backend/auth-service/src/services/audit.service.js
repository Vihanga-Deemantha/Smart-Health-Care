import AuthLog from "../models/AuthLog.js";

export const createAuthLog = async ({
  userId = null,
  email = null,
  action,
  ipAddress = null,
  userAgent = null,
  metadata = {}
}) => {
  await AuthLog.create({
    userId,
    email,
    action,
    ipAddress,
    userAgent,
    metadata
  });
};

export const createAuthLogSafely = async (payload, context = "auth audit log") => {
  try {
    await createAuthLog(payload);
  } catch (error) {
    console.error(`[audit] Failed to write ${context}:`, error);
  }
};
