import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/apiResponse.js";
import { getNotificationPreferences, updateNotificationPreferences } from "../services/notification.service.js";

export const handleGetNotificationPreferences = asyncHandler(async (req, res) => {
  const data = await getNotificationPreferences(req.user.userId);
  return sendResponse(res, 200, "Notification preferences fetched", data);
});

export const handleUpdateNotificationPreferences = asyncHandler(async (req, res) => {
  const data = await updateNotificationPreferences(req.user.userId, req.body);
  return sendResponse(res, 200, "Notification preferences updated", data);
});
