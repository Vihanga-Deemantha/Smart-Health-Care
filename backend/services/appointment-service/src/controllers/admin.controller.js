import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/apiResponse.js";
import { getAdminAnalytics } from "../services/admin.service.js";

export const handleAdminAnalytics = asyncHandler(async (req, res) => {
  const data = await getAdminAnalytics(req.query);
  return sendResponse(res, 200, "Admin analytics fetched", data);
});
