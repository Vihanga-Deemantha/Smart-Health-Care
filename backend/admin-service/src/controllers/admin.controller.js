import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/apiResponse.js";
import {
  getCurrentAdminProfile,
  updateCurrentAdminProfile,
  uploadCurrentAdminProfilePhoto,
  removeCurrentAdminProfilePhoto,
  changeCurrentAdminPassword,
  getAdmins,
  createAdmin,
  deleteAdmin,
  getUsers,
  getPendingDoctors,
  approveDoctor,
  rejectDoctor,
  updateUserStatus,
  getAdminActions,
  getSecurityActivity
} from "../services/admin.service.js";

export const handleGetUsers = asyncHandler(async (req, res) => {
  const data = await getUsers(req.query);
  sendResponse(res, 200, "Users fetched successfully", data);
});

export const handleGetCurrentAdminProfile = asyncHandler(async (req, res) => {
  const admin = await getCurrentAdminProfile(req.user.userId);
  sendResponse(res, 200, "Admin profile fetched successfully", { admin });
});

export const handleUpdateCurrentAdminProfile = asyncHandler(async (req, res) => {
  const admin = await updateCurrentAdminProfile(req.body, req.user.userId);
  sendResponse(res, 200, "Admin profile updated successfully", { admin });
});

export const handleUploadCurrentAdminProfilePhoto = asyncHandler(async (req, res) => {
  const admin = await uploadCurrentAdminProfilePhoto(req, req.user.userId);
  sendResponse(res, 200, "Admin profile photo updated successfully", { admin });
});

export const handleChangeCurrentAdminPassword = asyncHandler(async (req, res) => {
  await changeCurrentAdminPassword(req.body, req.user.userId);
  sendResponse(res, 200, "Admin password updated successfully");
});

export const handleRemoveCurrentAdminProfilePhoto = asyncHandler(async (req, res) => {
  const admin = await removeCurrentAdminProfilePhoto(req.user.userId);
  sendResponse(res, 200, "Admin profile photo removed successfully", { admin });
});

export const handleGetAdmins = asyncHandler(async (req, res) => {
  const data = await getAdmins(req.query, req.user.userId);
  sendResponse(res, 200, "Admins fetched successfully", data);
});

export const handleCreateAdmin = asyncHandler(async (req, res) => {
  const admin = await createAdmin(req.body, req.user.userId);
  sendResponse(res, 201, "Admin created successfully", { admin });
});

export const handleDeleteAdmin = asyncHandler(async (req, res) => {
  const admin = await deleteAdmin(req.params.id, req.user.userId);
  sendResponse(res, 200, "Admin deleted successfully", { admin });
});

export const handleGetPendingDoctors = asyncHandler(async (req, res) => {
  const users = await getPendingDoctors();
  sendResponse(res, 200, "Pending doctors fetched successfully", { users });
});

export const handleApproveDoctor = asyncHandler(async (req, res) => {
  const user = await approveDoctor(req.params.id, req.user.userId);
  sendResponse(res, 200, "Doctor approved successfully", { user });
});

export const handleRejectDoctor = asyncHandler(async (req, res) => {
  const user = await rejectDoctor(req.params.id, req.user.userId, req.body.reason);
  sendResponse(res, 200, "Doctor rejected successfully", { user });
});

export const handleUpdateUserStatus = asyncHandler(async (req, res) => {
  const user = await updateUserStatus(
    req.params.id,
    req.body.status,
    req.user.userId,
    req.body.reason
  );
  sendResponse(res, 200, "User status updated successfully", { user });
});

export const handleGetAdminActions = asyncHandler(async (req, res) => {
  const data = await getAdminActions(req.query);
  sendResponse(res, 200, "Admin actions fetched successfully", data);
});

export const handleGetSecurityActivity = asyncHandler(async (req, res) => {
  const data = await getSecurityActivity(req.query);
  sendResponse(res, 200, "Security activity fetched successfully", data);
});
