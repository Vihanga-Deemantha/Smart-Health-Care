import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/apiResponse.js";
import {
  getUsersInternal,
  getPendingDoctorsInternal,
  approveDoctorInternal,
  rejectDoctorInternal,
  updateUserStatusInternal,
  getDashboardCountsInternal
} from "../services/internalAdmin.service.js";

export const handleGetUsersInternal = asyncHandler(async (req, res) => {
  const data = await getUsersInternal(req.query);
  sendResponse(res, 200, "Users fetched successfully", data);
});

export const handleGetPendingDoctorsInternal = asyncHandler(async (req, res) => {
  const users = await getPendingDoctorsInternal();
  sendResponse(res, 200, "Pending doctors fetched successfully", { users });
});

export const handleApproveDoctorInternal = asyncHandler(async (req, res) => {
  const user = await approveDoctorInternal(req.params.id, req.body.adminUserId);
  sendResponse(res, 200, "Doctor approved successfully", { user });
});

export const handleRejectDoctorInternal = asyncHandler(async (req, res) => {
  const user = await rejectDoctorInternal(
    req.params.id,
    req.body.adminUserId,
    req.body.reason
  );
  sendResponse(res, 200, "Doctor rejected successfully", { user });
});

export const handleUpdateUserStatusInternal = asyncHandler(async (req, res) => {
  const user = await updateUserStatusInternal(req.params.id, req.body.status);
  sendResponse(res, 200, "User status updated successfully", { user });
});

export const handleGetDashboardCountsInternal = asyncHandler(async (req, res) => {
  const stats = await getDashboardCountsInternal();
  sendResponse(res, 200, "Dashboard counts fetched successfully", stats);
});

