import mongoose from "mongoose";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";

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

  user.doctorVerificationStatus = "APPROVED";
  user.accountStatus = user.isEmailVerified ? "ACTIVE" : "PENDING";
  user.doctorReviewedBy = adminUserId;
  user.doctorReviewedAt = new Date();
  user.doctorRejectionReason = null;

  await user.save();

  return user;
};

export const rejectDoctorInternal = async (doctorUserId, adminUserId, reason) => {
  ensureValidObjectId(doctorUserId, "Invalid doctor user id");
  ensureValidObjectId(adminUserId, "Invalid admin user id");

  const user = await User.findById(doctorUserId);
  if (!user) throw new AppError("Doctor user not found", 404);
  if (user.role !== "DOCTOR") throw new AppError("User is not a doctor", 400);

  user.doctorVerificationStatus = "REJECTED";
  user.accountStatus = "PENDING";
  user.doctorReviewedBy = adminUserId;
  user.doctorReviewedAt = new Date();
  user.doctorRejectionReason = reason || "Rejected by admin";

  await user.save();

  return user;
};

export const updateUserStatusInternal = async (userId, status) => {
  ensureValidObjectId(userId, "Invalid user id");

  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  user.accountStatus = status;
  await user.save();

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
    suspendedUsers
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "PATIENT" }),
    User.countDocuments({ role: "DOCTOR" }),
    User.countDocuments({ role: "ADMIN" }),
    User.countDocuments({ role: "DOCTOR", doctorVerificationStatus: "PENDING" }),
    User.countDocuments({ accountStatus: "ACTIVE" }),
    User.countDocuments({ accountStatus: "SUSPENDED" })
  ]);

  return {
    totalUsers,
    totalPatients,
    totalDoctors,
    totalAdmins,
    pendingDoctors,
    activeUsers,
    suspendedUsers
  };
};

