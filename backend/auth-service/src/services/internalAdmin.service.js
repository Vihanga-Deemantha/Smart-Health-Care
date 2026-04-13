import mongoose from "mongoose";
import AuthLog from "../models/AuthLog.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { createAuthLogSafely } from "./audit.service.js";
import {
  buildAccountStatusBreakdown,
  buildDoctorVerificationPipeline,
  buildRoleDistribution,
  buildUserGrowthDataset
} from "../utils/dashboardAnalytics.js";
import {
  sendAccountStatusEmail,
  sendDoctorApprovedEmail,
  sendDoctorRejectedEmail,
  sendEmailSafely
} from "./email.service.js";

export const getAuthLogsInternal = async ({
  page = 1,
  limit = 10,
  action,
  email,
  userId
}) => {
  const query = {};

  if (action) query.action = action;
  if (email) query.email = email.trim().toLowerCase();
  if (userId) query.userId = userId;

  const skip = (Number(page) - 1) * Number(limit);

  const [logs, total] = await Promise.all([
    AuthLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    AuthLog.countDocuments(query)
  ]);

  return {
    logs,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit))
    }
  };
};

export const getUsersInternal = async ({
  page = 1,
  limit = 10,
  role,
  accountStatus,
  doctorVerificationStatus,
  search
}) => {
  const query = {};

  if (role) query.role = role;
  if (accountStatus) query.accountStatus = accountStatus;
  if (doctorVerificationStatus) query.doctorVerificationStatus = doctorVerificationStatus;

  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [users, total] = await Promise.all([
    User.find(query)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(query)
  ]);

  return {
    users,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit))
    }
  };
};

export const getPendingDoctorsInternal = async () => {
  const users = await User.find({
    role: "DOCTOR",
    doctorVerificationStatus: "PENDING",
    isEmailVerified: true
  })
    .select("-passwordHash")
    .sort({ createdAt: -1 });

  return users;
};

const ensureValidObjectId = (id, message) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(message, 400);
  }
};

export const approveDoctorInternal = async (doctorUserId, adminUserId) => {
  ensureValidObjectId(doctorUserId, "Invalid doctor user id");
  ensureValidObjectId(adminUserId, "Invalid admin user id");

  const user = await User.findById(doctorUserId);
  if (!user) throw new AppError("Doctor user not found", 404);
  if (user.role !== "DOCTOR") throw new AppError("User is not a doctor", 400);

  const previousDoctorVerificationStatus = user.doctorVerificationStatus;
  const previousAccountStatus = user.accountStatus;
  user.doctorVerificationStatus = "APPROVED";
  user.accountStatus = user.isEmailVerified ? "ACTIVE" : "PENDING";
  user.doctorReviewedBy = adminUserId;
  user.doctorReviewedAt = new Date();
  user.doctorRejectionReason = null;

  await user.save();

  await createAuthLogSafely({
    userId: user._id,
    email: user.email,
    action: "DOCTOR_APPROVED",
    metadata: {
      adminUserId,
      previousDoctorVerificationStatus,
      previousAccountStatus,
      nextAccountStatus: user.accountStatus
    }
  }, `doctor approved log for ${user.email}`);

  await sendEmailSafely(
    () =>
      sendDoctorApprovedEmail({
        email: user.email,
        fullName: user.fullName
      }),
    `doctor approval email for ${user.email}`
  );

  return user;
};

export const rejectDoctorInternal = async (doctorUserId, adminUserId, reason) => {
  ensureValidObjectId(doctorUserId, "Invalid doctor user id");
  ensureValidObjectId(adminUserId, "Invalid admin user id");

  const user = await User.findById(doctorUserId);
  if (!user) throw new AppError("Doctor user not found", 404);
  if (user.role !== "DOCTOR") throw new AppError("User is not a doctor", 400);

  const previousDoctorVerificationStatus = user.doctorVerificationStatus;
  user.doctorVerificationStatus = "CHANGES_REQUESTED";
  user.accountStatus = "PENDING";
  user.doctorReviewedBy = adminUserId;
  user.doctorReviewedAt = new Date();
  user.doctorRejectionReason = reason || "Changes requested by admin";

  await user.save();

  await createAuthLogSafely({
    userId: user._id,
    email: user.email,
    action: "DOCTOR_CHANGES_REQUESTED",
    metadata: {
      adminUserId,
      previousDoctorVerificationStatus,
      reason: user.doctorRejectionReason
    }
  }, `doctor changes requested log for ${user.email}`);

  await sendEmailSafely(
    () =>
      sendDoctorRejectedEmail({
        email: user.email,
        fullName: user.fullName,
        reason: user.doctorRejectionReason
      }),
    `doctor rejection email for ${user.email}`
  );

  return user;
};

export const updateUserStatusInternal = async (userId, status, adminUserId, reason) => {
  ensureValidObjectId(userId, "Invalid user id");
  ensureValidObjectId(adminUserId, "Invalid admin user id");

  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  const previousAccountStatus = user.accountStatus;
  user.accountStatus = status;
  user.accountStatusChangedBy = adminUserId;
  user.accountStatusChangedAt = new Date();
  user.accountStatusReason =
    status === "SUSPENDED" ? reason?.trim() || "Suspended by admin" : reason?.trim() || null;
  await user.save();

  await createAuthLogSafely({
    userId: user._id,
    email: user.email,
    action: status === "SUSPENDED" ? "ACCOUNT_SUSPENDED" : "ACCOUNT_ACTIVATED",
    metadata: {
      adminUserId,
      previousAccountStatus,
      nextAccountStatus: status,
      reason: user.accountStatusReason
    }
  }, `account status change log for ${user.email}`);

  if (status === "ACTIVE" || status === "SUSPENDED") {
    await sendEmailSafely(
      () =>
        sendAccountStatusEmail({
          email: user.email,
          fullName: user.fullName,
          status,
          reason: user.accountStatusReason
        }),
      `account status email for ${user.email}`
    );
  }

  return user;
};

export const getDashboardCountsInternal = async () => {
  const [
    totalUsers,
    totalPatients,
    totalDoctors,
    totalAdmins,
    pendingDoctors,
    activeUsers,
    suspendedUsers,
    pendingUsers,
    lockedUsers,
    approvedDoctors,
    changesRequestedDoctors,
    rejectedDoctors,
    recentUsers
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "PATIENT" }),
    User.countDocuments({ role: "DOCTOR" }),
    User.countDocuments({ role: "ADMIN" }),
    User.countDocuments({ role: "DOCTOR", doctorVerificationStatus: "PENDING" }),
    User.countDocuments({ accountStatus: "ACTIVE" }),
    User.countDocuments({ accountStatus: "SUSPENDED" }),
    User.countDocuments({ accountStatus: "PENDING" }),
    User.countDocuments({ accountStatus: "LOCKED" }),
    User.countDocuments({ role: "DOCTOR", doctorVerificationStatus: "APPROVED" }),
    User.countDocuments({
      role: "DOCTOR",
      doctorVerificationStatus: "CHANGES_REQUESTED"
    }),
    User.countDocuments({ role: "DOCTOR", doctorVerificationStatus: "REJECTED" }),
    User.find({
      createdAt: {
        $gte: (() => {
          const startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          startDate.setDate(startDate.getDate() - 13);
          return startDate;
        })()
      }
    }).select("role createdAt")
  ]);

  return {
    totalUsers,
    totalPatients,
    totalDoctors,
    totalAdmins,
    pendingDoctors,
    activeUsers,
    suspendedUsers,
    userGrowth: buildUserGrowthDataset(recentUsers, 14),
    roleDistribution: buildRoleDistribution({
      totalPatients,
      totalDoctors,
      totalAdmins
    }),
    doctorVerificationPipeline: buildDoctorVerificationPipeline({
      pending: pendingDoctors,
      approved: approvedDoctors,
      changesRequested: changesRequestedDoctors,
      rejected: rejectedDoctors
    }),
    accountStatusBreakdown: buildAccountStatusBreakdown({
      active: activeUsers,
      pending: pendingUsers,
      suspended: suspendedUsers,
      locked: lockedUsers
    })
  };
};

