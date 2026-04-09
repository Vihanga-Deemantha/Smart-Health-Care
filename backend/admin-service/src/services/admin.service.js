import AdminAction from "../models/AdminAction.js";
import {
  fetchAuthLogsFromAuth,
  fetchUsersFromAuth,
  fetchPendingDoctorsFromAuth,
  approveDoctorInAuth,
  rejectDoctorInAuth,
  updateUserStatusInAuth
} from "./authClient.service.js";

export const getUsers = async (query) => {
  return fetchUsersFromAuth(query);
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
    action: "DOCTOR_REJECTED",
    reason: reason || "Rejected by admin"
  });

  return user;
};

export const updateUserStatus = async (userId, status, adminUserId) => {
  const user = await updateUserStatusInAuth(userId, status);

  await AdminAction.create({
    adminUserId,
    targetUserId: userId,
    action: status === "SUSPENDED" ? "USER_SUSPENDED" : "USER_ACTIVATED"
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
  const skip = (normalizedPage - 1) * normalizedLimit;

  const [authLogsData, adminActions, adminTotal] = await Promise.all([
    fetchAuthLogsFromAuth({ page: 1, limit: mergedFetchLimit }),
    AdminAction.find().sort({ createdAt: -1 }).limit(mergedFetchLimit),
    AdminAction.countDocuments()
  ]);

  const authEvents = (authLogsData.logs || []).map((log) => ({
    id: `auth-${log._id}`,
    type: "AUTH_LOG",
    action: log.action,
    createdAt: log.createdAt,
    actorUserId: log.userId || null,
    actorEmail: log.email || null,
    targetUserId: null,
    reason: null,
    ipAddress: log.ipAddress || null,
    userAgent: log.userAgent || null,
    metadata: log.metadata || {}
  }));

  const adminEvents = adminActions.map((action) => ({
    id: `admin-${action._id}`,
    type: "ADMIN_ACTION",
    action: action.action,
    createdAt: action.createdAt,
    actorUserId: action.adminUserId,
    actorEmail: null,
    targetUserId: action.targetUserId,
    reason: action.reason || null,
    ipAddress: null,
    userAgent: null,
    metadata: {}
  }));

  const events = [...authEvents, ...adminEvents]
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(skip, skip + normalizedLimit);

  const total = Number(authLogsData.pagination?.total || 0) + adminTotal;

  return {
    events,
    pagination: {
      total,
      page: normalizedPage,
      limit: normalizedLimit,
      pages: Math.ceil(total / normalizedLimit)
    }
  };
};
