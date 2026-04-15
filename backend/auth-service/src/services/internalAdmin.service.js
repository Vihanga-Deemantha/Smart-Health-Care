import mongoose from "mongoose";
import AuthLog from "../models/AuthLog.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { createAuthLogSafely } from "./audit.service.js";
import { comparePassword, hashPassword } from "../utils/hash.js";
import {
  buildAccountStatusBreakdown,
  buildDoctorVerificationPipeline,
  buildRoleDistribution,
  buildUserGrowthDataset
} from "../utils/dashboardAnalytics.js";
import { revokeAllUserRefreshTokens } from "./token.service.js";
import {
  deleteAdminProfilePhotoByPublicId,
  uploadAdminProfilePhotoBuffer
} from "./storage.service.js";
import { publishNotificationEventSafely } from "../events/publishers/notificationPublisher.js";
import { normalizeSriLankanPhone } from "../utils/phone.js";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];
const normalizeEmail = (email = "") => email.trim().toLowerCase();
const normalizePhone = (phone = "") =>
  normalizeSriLankanPhone(phone) || phone.trim();

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

const ensureAdminActor = async (adminUserId) => {
  ensureValidObjectId(adminUserId, "Invalid admin user id");

  const actor = await User.findById(adminUserId).select(
    "fullName email role accountStatus passwordHash phone jobTitle failedLoginAttempts lockUntil"
  );

  if (!actor) {
    throw new AppError("Admin user not found", 404);
  }

  if (!ADMIN_ROLES.includes(actor.role)) {
    throw new AppError("Only an admin can perform this action", 403);
  }

  if (actor.accountStatus !== "ACTIVE") {
    throw new AppError("Only an active admin can perform this action", 403);
  }

  return actor;
};

const ensureSuperAdminActor = async (adminUserId) => {
  const actor = await ensureAdminActor(adminUserId);

  if (actor.role !== "SUPER_ADMIN") {
    throw new AppError("Only a super admin can perform this action", 403);
  }

  return actor;
};

export const getCurrentAdminProfileInternal = async (adminUserId) => {
  const admin = await ensureAdminActor(adminUserId);

  return User.findById(admin._id).select("-passwordHash");
};

export const updateCurrentAdminProfileInternal = async (adminUserId, payload) => {
  const admin = await ensureAdminActor(adminUserId);
  const changedFields = [];

  if (typeof payload.fullName === "string" && payload.fullName.trim() !== admin.fullName) {
    admin.fullName = payload.fullName.trim();
    changedFields.push("fullName");
  }

  if (typeof payload.phone === "string" && payload.phone.trim() !== admin.phone) {
    admin.phone = normalizePhone(payload.phone);
    changedFields.push("phone");
  }

  if (typeof payload.jobTitle === "string") {
    const normalizedJobTitle = payload.jobTitle.trim() || null;

    if (normalizedJobTitle !== admin.jobTitle) {
      admin.jobTitle = normalizedJobTitle;
      changedFields.push("jobTitle");
    }
  }

  await admin.save();

  await createAuthLogSafely(
    {
      userId: admin._id,
      email: admin.email,
      action: "ADMIN_PROFILE_UPDATED",
      metadata: {
        changedFields
      }
    },
    `admin profile updated log for ${admin.email}`
  );

  return User.findById(admin._id).select("-passwordHash");
};

export const uploadCurrentAdminProfilePhotoInternal = async (adminUserId, file) => {
  const admin = await ensureAdminActor(adminUserId);

  if (!file?.buffer) {
    throw new AppError("Profile photo file is required", 400);
  }

  const previousProfilePhoto = admin.profilePhoto;
  let uploadedPhoto = null;

  try {
    uploadedPhoto = await uploadAdminProfilePhotoBuffer({
      buffer: file.buffer,
      filename: file.originalname
    });

    admin.profilePhoto = {
      url: uploadedPhoto.secure_url,
      publicId: uploadedPhoto.public_id,
      uploadedAt: new Date()
    };

    await admin.save();
  } catch (error) {
    if (uploadedPhoto?.public_id) {
      await deleteAdminProfilePhotoByPublicId(uploadedPhoto.public_id).catch((cleanupError) => {
        console.error(
          "[storage] Failed to cleanup uploaded admin profile photo after error:",
          cleanupError
        );
      });
    }

    throw error;
  }

  await createAuthLogSafely(
    {
      userId: admin._id,
      email: admin.email,
      action: "ADMIN_PROFILE_PHOTO_UPDATED",
      metadata: {
        hadPreviousPhoto: Boolean(previousProfilePhoto?.publicId || previousProfilePhoto?.url)
      }
    },
    `admin profile photo updated log for ${admin.email}`
  );

  if (previousProfilePhoto?.publicId) {
    await deleteAdminProfilePhotoByPublicId(previousProfilePhoto.publicId).catch(
      (cleanupError) => {
        console.error(
          "[storage] Failed to cleanup replaced admin profile photo:",
          cleanupError
        );
      }
    );
  }

  return User.findById(admin._id).select("-passwordHash");
};

export const removeCurrentAdminProfilePhotoInternal = async (adminUserId) => {
  const admin = await ensureAdminActor(adminUserId);
  const previousProfilePhoto = admin.profilePhoto;

  if (!previousProfilePhoto?.publicId && !previousProfilePhoto?.url) {
    return User.findById(admin._id).select("-passwordHash");
  }

  admin.profilePhoto = null;
  await admin.save();

  await createAuthLogSafely(
    {
      userId: admin._id,
      email: admin.email,
      action: "ADMIN_PROFILE_PHOTO_REMOVED"
    },
    `admin profile photo removed log for ${admin.email}`
  );

  if (previousProfilePhoto?.publicId) {
    await deleteAdminProfilePhotoByPublicId(previousProfilePhoto.publicId).catch(
      (cleanupError) => {
        console.error(
          "[storage] Failed to cleanup removed admin profile photo:",
          cleanupError
        );
      }
    );
  }

  return User.findById(admin._id).select("-passwordHash");
};

export const changeCurrentAdminPasswordInternal = async (
  adminUserId,
  { currentPassword, newPassword }
) => {
  const admin = await ensureAdminActor(adminUserId);
  const isCurrentPasswordValid = await comparePassword(currentPassword, admin.passwordHash);

  if (!isCurrentPasswordValid) {
    throw new AppError("Current password is incorrect", 400);
  }

  const isSamePassword = await comparePassword(newPassword, admin.passwordHash);
  if (isSamePassword) {
    throw new AppError("New password must be different from the current password", 400);
  }

  admin.passwordHash = await hashPassword(newPassword);
  admin.failedLoginAttempts = 0;
  admin.lockUntil = null;
  await admin.save();

  await revokeAllUserRefreshTokens(admin._id);

  await createAuthLogSafely(
    {
      userId: admin._id,
      email: admin.email,
      action: "ADMIN_PASSWORD_CHANGED"
    },
    `admin password changed log for ${admin.email}`
  );

  return true;
};

export const getAdminsInternal = async (
  { page = 1, limit = 10, search },
  adminUserId
) => {
  await ensureSuperAdminActor(adminUserId);

  const query = {
    role: { $in: ADMIN_ROLES }
  };

  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [admins, total] = await Promise.all([
    User.find(query)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(query)
  ]);

  return {
    admins,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit))
    }
  };
};

export const createAdminInternal = async (payload, adminUserId) => {
  const actor = await ensureSuperAdminActor(adminUserId);
  const email = normalizeEmail(payload.email);

  const existingAdmin = await User.findOne({ email });
  if (existingAdmin) {
    throw new AppError("Email already registered", 409);
  }

  const passwordHash = await hashPassword(payload.password);

  const admin = await User.create({
    fullName: payload.fullName.trim(),
    email,
    phone: normalizePhone(payload.phone),
    jobTitle: payload.jobTitle?.trim() || null,
    passwordHash,
    role: "ADMIN",
    isEmailVerified: true,
    accountStatus: "ACTIVE",
    doctorVerificationStatus: "NOT_REQUIRED"
  });

  await createAuthLogSafely(
    {
      userId: admin._id,
      email: admin.email,
      action: "ADMIN_CREATED",
      metadata: {
        createdByUserId: actor._id,
        createdByEmail: actor.email,
        createdByRole: actor.role,
        role: admin.role
      }
    },
    `admin created log for ${admin.email}`
  );

  return User.findById(admin._id).select("-passwordHash");
};

export const deleteAdminInternal = async (targetAdminId, adminUserId) => {
  const actor = await ensureSuperAdminActor(adminUserId);
  ensureValidObjectId(targetAdminId, "Invalid admin id");

  if (targetAdminId === String(actor._id)) {
    throw new AppError("You cannot delete your own super admin account", 400);
  }

  const targetAdmin = await User.findById(targetAdminId);
  if (!targetAdmin) {
    throw new AppError("Admin user not found", 404);
  }

  if (!ADMIN_ROLES.includes(targetAdmin.role)) {
    throw new AppError("Target user is not an admin account", 400);
  }

  if (targetAdmin.role === "SUPER_ADMIN") {
    const totalSuperAdmins = await User.countDocuments({ role: "SUPER_ADMIN" });

    if (totalSuperAdmins <= 1) {
      throw new AppError("Cannot delete the last super admin account", 400);
    }
  }

  const deletedAdmin = {
    _id: targetAdmin._id,
    fullName: targetAdmin.fullName,
    email: targetAdmin.email,
    phone: targetAdmin.phone,
    role: targetAdmin.role,
    accountStatus: targetAdmin.accountStatus,
    createdAt: targetAdmin.createdAt,
    updatedAt: targetAdmin.updatedAt
  };

  await targetAdmin.deleteOne();

  await createAuthLogSafely(
    {
      email: deletedAdmin.email,
      action: "ADMIN_DELETED",
      metadata: {
        deletedAdminUserId: deletedAdmin._id,
        deletedAdminRole: deletedAdmin.role,
        deletedByUserId: actor._id,
        deletedByEmail: actor.email,
        deletedByRole: actor.role
      }
    },
    `admin deleted log for ${deletedAdmin.email}`
  );

  return deletedAdmin;
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

  publishNotificationEventSafely({
    routingKey: "notification.doctor.approved",
    user,
    metadata: {
      doctorVerificationStatus: user.doctorVerificationStatus,
      accountStatus: user.accountStatus,
      adminUserId
    },
    contextLabel: `doctor approved event for ${user.email}`
  });

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

  publishNotificationEventSafely({
    routingKey: "notification.doctor.rejected",
    user,
    metadata: {
      doctorVerificationStatus: user.doctorVerificationStatus,
      accountStatus: user.accountStatus,
      reason: user.doctorRejectionReason,
      adminUserId
    },
    contextLabel: `doctor rejected event for ${user.email}`
  });

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
    publishNotificationEventSafely({
      routingKey:
        status === "SUSPENDED"
          ? "notification.account.suspended"
          : "notification.account.reactivated",
      user,
      metadata: {
        accountStatus: status,
        reason: user.accountStatusReason,
        adminUserId
      },
      contextLabel: `account status event for ${user.email}`
    });
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
    User.countDocuments({ role: { $in: ADMIN_ROLES } }),
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

