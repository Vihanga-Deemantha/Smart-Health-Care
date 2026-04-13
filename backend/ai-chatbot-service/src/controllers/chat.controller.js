import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/apiResponse.js";
import AppError from "../utils/AppError.js";
import { generateChatReply } from "../services/chat.service.js";

export const handleChat = asyncHandler(async (req, res) => {
  if (req.user?.role !== "PATIENT") {
    throw new AppError("Only patients can use AI chat", 403, "FORBIDDEN");
  }

  const data = await generateChatReply({
    patientId: req.user.userId,
    message: req.body.message
  });

  return sendResponse(res, 200, "AI response generated", data);
});
