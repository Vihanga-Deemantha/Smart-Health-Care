import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/apiResponse.js";
import { createEmergencyAlert, listEmergencyResources } from "../services/emergency.service.js";

export const handleCreateEmergencyAlert = asyncHandler(async (req, res) => {
  const alert = await createEmergencyAlert({
    ...req.body,
    raisedBy: req.user.userId,
    raisedByRole: req.user.role
  });

  return sendResponse(res, 201, "Emergency alert created", alert);
});

export const handleListEmergencyResources = asyncHandler(async (req, res) => {
  const resources = await listEmergencyResources(req.query);
  return sendResponse(res, 200, "Emergency resources fetched", resources);
});
