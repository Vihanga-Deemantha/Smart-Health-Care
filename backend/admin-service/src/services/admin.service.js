import AdminAction from "../models/AdminAction.js";
import {
  fetchAuthLogsFromAuth,
  fetchAdminsFromAuth,
  fetchCurrentAdminProfileFromAuth,
  createAdminInAuth,
  deleteAdminInAuth,
  updateCurrentAdminProfileInAuth,
  uploadCurrentAdminProfilePhotoInAuth,
  removeCurrentAdminProfilePhotoInAuth,
  changeCurrentAdminPasswordInAuth,
  fetchUsersFromAuth,
  fetchPendingDoctorsFromAuth,
  approveDoctorInAuth,
  rejectDoctorInAuth,
  updateUserStatusInAuth
} from "./authClient.service.js";
import { buildSecurityActivityFeed } from "../utils/securityActivity.js";

export const getUsers = async (query) => {
  return fetchUsersFromAuth(query);
};

export const getCurrentAdminProfile = async (adminUserId) => {
  return fetchCurrentAdminProfileFromAuth(adminUserId);
};

export const getAdmins = async (query, adminUserId) => {
  return fetchAdminsFromAuth(query, adminUserId);
};

export const updateCurrentAdminProfile = async (payload, adminUserId) => {
  return updateCurrentAdminProfileInAuth(payload, adminUserId);
};

export const uploadCurrentAdminProfilePhoto = async (req, adminUserId) => {
  return uploadCurrentAdminProfilePhotoInAuth(req, adminUserId);
};

export const removeCurrentAdminProfilePhoto = async (adminUserId) => {
  return removeCurrentAdminProfilePhotoInAuth(adminUserId);
};

export const changeCurrentAdminPassword = async (payload, adminUserId) => {
  return changeCurrentAdminPasswordInAuth(payload, adminUserId);
};

export const createAdmin = async (payload, adminUserId) => {
  const admin = await createAdminInAuth(payload, adminUserId);

  await AdminAction.create({
    adminUserId,
    targetUserId: admin._id,
    action: "ADMIN_CREATED"
  });

  return admin;
};

export const deleteAdmin = async (targetAdminId, adminUserId) => {
  const admin = await deleteAdminInAuth(targetAdminId, adminUserId);

  await AdminAction.create({
    adminUserId,
    targetUserId: targetAdminId,
    action: "ADMIN_DELETED"
  });

  return admin;
};

export const getPendingDoctors = async () => {
  return fetchPendingDoctorsFromAuth();
};

export const approveDoctor = async (doctorUserId, adminUserId) => {
  const user = await approveDoctorInAuth(doctorUserId, adminUserId);

  await AdminAction.create({
    adminUserId,
    targetUserId: doctorUserId,
    action: "DOCTOR_APPROVED"
  });

  return user;
};

export const rejectDoctor = async (doctorUserId, adminUserId, reason) => {
  const user = await rejectDoctorInAuth(doctorUserId, adminUserId, reason);

  await AdminAction.create({
    adminUserId,
    targetUserId: doctorUserId,
    action: "DOCTOR_CHANGES_REQUESTED",
    reason: reason || "Changes requested by admin"
  });

  return user;
};

export const updateUserStatus = async (userId, status, adminUserId, reason) => {
  const user = await updateUserStatusInAuth(userId, status, adminUserId, reason);

  await AdminAction.create({
    adminUserId,
    targetUserId: userId,
    action: status === "SUSPENDED" ? "USER_SUSPENDED" : "USER_ACTIVATED",
    reason: reason || null
  });

  return user;
};

export const getAdminActions = async ({
  page = 1,
  limit = 10,
  action,
  adminUserId,
  targetUserId
}) => {
  const query = {};

  if (action) query.action = action;
  if (adminUserId) query.adminUserId = adminUserId;
  if (targetUserId) query.targetUserId = targetUserId;

  const skip = (Number(page) - 1) * Number(limit);

  const [actions, total] = await Promise.all([
    AdminAction.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    AdminAction.countDocuments(query)
  ]);

  return {
    actions,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit))
    }
  };
};

export const getSecurityActivity = async ({ page = 1, limit = 10 }) => {
  const normalizedPage = Number(page);
  const normalizedLimit = Number(limit);
  const mergedFetchLimit = normalizedPage * normalizedLimit;

  const [authLogsData, adminActions, adminTotal] = await Promise.all([
    fetchAuthLogsFromAuth({ page: 1, limit: mergedFetchLimit }),
    AdminAction.find().sort({ createdAt: -1 }).limit(mergedFetchLimit),
    AdminAction.countDocuments()
  ]);

  return buildSecurityActivityFeed({
    authLogs: authLogsData.logs || [],
    adminActions,
    adminTotal,
    authTotal: Number(authLogsData.pagination?.total || 0),
    page: normalizedPage,
    limit: normalizedLimit
  });
};
