import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/apiResponse.js";
import {
  getCurrentAdminProfileInternal,
  updateCurrentAdminProfileInternal,
  uploadCurrentAdminProfilePhotoInternal,
  removeCurrentAdminProfilePhotoInternal,
  changeCurrentAdminPasswordInternal,
  getAuthLogsInternal,
  getAdminsInternal,
  createAdminInternal,
  deleteAdminInternal,
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

export const handleGetCurrentAdminProfileInternal = asyncHandler(async (req, res) => {
  const admin = await getCurrentAdminProfileInternal(req.query.adminUserId);
  sendResponse(res, 200, "Admin profile fetched successfully", { admin });
});

export const handleGetAdminsInternal = asyncHandler(async (req, res) => {
  const data = await getAdminsInternal(req.query, req.query.adminUserId);
  sendResponse(res, 200, "Admins fetched successfully", data);
});

export const handleUpdateCurrentAdminProfileInternal = asyncHandler(async (req, res) => {
  const admin = await updateCurrentAdminProfileInternal(req.body.adminUserId, req.body);
  sendResponse(res, 200, "Admin profile updated successfully", { admin });
});

export const handleUploadCurrentAdminProfilePhotoInternal = asyncHandler(async (req, res) => {
  const admin = await uploadCurrentAdminProfilePhotoInternal(
    req.get("x-admin-user-id"),
    req.file
  );
  sendResponse(res, 200, "Admin profile photo updated successfully", { admin });
});

export const handleGetAuthLogsInternal = asyncHandler(async (req, res) => {
  const data = await getAuthLogsInternal(req.query);
  sendResponse(res, 200, "Auth logs fetched successfully", data);
});

export const handleChangeCurrentAdminPasswordInternal = asyncHandler(async (req, res) => {
  await changeCurrentAdminPasswordInternal(req.body.adminUserId, req.body);
  sendResponse(res, 200, "Admin password updated successfully");
});

export const handleRemoveCurrentAdminProfilePhotoInternal = asyncHandler(async (req, res) => {
  const admin = await removeCurrentAdminProfilePhotoInternal(req.get("x-admin-user-id"));
  sendResponse(res, 200, "Admin profile photo removed successfully", { admin });
});

export const handleCreateAdminInternal = asyncHandler(async (req, res) => {
  const admin = await createAdminInternal(req.body, req.body.adminUserId);
  sendResponse(res, 201, "Admin created successfully", { admin });
});

export const handleDeleteAdminInternal = asyncHandler(async (req, res) => {
  const admin = await deleteAdminInternal(req.params.id, req.body.adminUserId);
  sendResponse(res, 200, "Admin deleted successfully", { admin });
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
  sendResponse(res, 200, "Doctor changes requested successfully", { user });
});

export const handleUpdateUserStatusInternal = asyncHandler(async (req, res) => {
  const user = await updateUserStatusInternal(
    req.params.id,
    req.body.status,
    req.body.adminUserId,
    req.body.reason
  );
  sendResponse(res, 200, "User status updated successfully", { user });
});

export const handleGetDashboardCountsInternal = asyncHandler(async (req, res) => {
  const stats = await getDashboardCountsInternal();
  sendResponse(res, 200, "Dashboard counts fetched successfully", stats);
});

