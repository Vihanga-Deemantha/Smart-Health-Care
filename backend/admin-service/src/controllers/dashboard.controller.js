import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/apiResponse.js";
import { getDashboardStats } from "../services/dashboard.service.js";

export const handleGetDashboardStats = asyncHandler(async (req, res) => {
  const stats = await getDashboardStats();
  sendResponse(res, 200, "Dashboard stats fetched successfully", stats);
});

