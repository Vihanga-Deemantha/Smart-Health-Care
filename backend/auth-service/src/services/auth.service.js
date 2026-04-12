import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { createAuthLog } from "./audit.service.js";
import { createAndSendOtp } from "./otp.service.js";
import { issueTokens } from "./token.service.js";

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const resolveAccountStatus = (user) => {
  const now = new Date();

  if (user.accountStatus === "LOCKED") {
    if (user.lockUntil && user.lockUntil > now) {
      return {
        isLocked: true,
        accountStatus: "LOCKED"
      };
    }

    user.lockUntil = null;
    user.failedLoginAttempts = 0;
    user.accountStatus = "PENDING";
  }

  if (user.accountStatus === "SUSPENDED") {
    return {
      isSuspended: true,
      accountStatus: "SUSPENDED"
    };
  }

  if (user.isEmailVerified) {
    if (user.role === "PATIENT") {
      user.accountStatus = "ACTIVE";
    }

    if (user.role === "DOCTOR" && user.doctorVerificationStatus === "APPROVED") {
      user.accountStatus = "ACTIVE";
    }
  }

  return {
    isLocked: false,
    isSuspended: false,
    accountStatus: user.accountStatus
  };
};

export const registerPatient = async (payload, req) => {
  const { fullName, phone, password } = payload;
  const email = normalizeEmail(payload.email);

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError(
      existingUser.isEmailVerified
        ? "Email already registered. Please sign in instead."
        : "An account with this email already exists but is not verified yet. Please verify your email or resend the OTP.",
      409
    );
  }

  const passwordHash = await hashPassword(password);

  const user = await User.create({
    fullName,
    email,
    phone,
    passwordHash,
    role: "PATIENT",
    accountStatus: "PENDING",
    doctorVerificationStatus: "NOT_REQUIRED"
  });

  await createAuthLog({
    userId: user._id,
    email: user.email,
    action: "REGISTERED",
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
    metadata: { role: user.role }
  });

  let otpSent = true;

  try {
    await createAndSendOtp(user.email, "EMAIL_VERIFY");
  } catch (error) {
    otpSent = false;

    if (error?.statusCode === 503) {
      return { user, otpSent };
    }

    throw error;
  }

  return { user, otpSent };
};

export const registerDoctor = async (payload, req) => {
  const {
    fullName,
    email,
    phone,
    password,
    medicalLicenseNumber,
    specialization,
    yearsOfExperience,
    qualificationDocuments
  } = payload;
  const normalizedEmail = normalizeEmail(email);

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError(
      existingUser.isEmailVerified
        ? "Email already registered. Please sign in instead."
        : "An account with this email already exists but is not verified yet. Please verify your email or resend the OTP.",
      409
    );
  }

  const passwordHash = await hashPassword(password);

  const user = await User.create({
    fullName,
    email: normalizedEmail,
    phone,
    passwordHash,
    role: "DOCTOR",
    accountStatus: "PENDING",
    doctorVerificationStatus: "PENDING",
    medicalLicenseNumber,
    specialization,
    yearsOfExperience: yearsOfExperience || 0,
    qualificationDocuments: qualificationDocuments || []
  });

  await createAuthLog({
    userId: user._id,
    email: user.email,
    action: "REGISTERED",
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
    metadata: { role: user.role }
  });

  let otpSent = true;

  try {
    await createAndSendOtp(user.email, "EMAIL_VERIFY");
  } catch (error) {
    otpSent = false;

    if (error?.statusCode === 503) {
      return { user, otpSent };
    }

    throw error;
  }

  return { user, otpSent };
};

export const loginUser = async ({ email, password }, req) => {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    await createAuthLog({
      email: normalizedEmail,
      action: "LOGIN_FAILED",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      metadata: { reason: "User not found" }
    });

    throw new AppError("Invalid email or password", 401);
  }

  const statusState = resolveAccountStatus(user);

  if (statusState.isSuspended) {
    throw new AppError("Account is suspended", 403);
  }

  if (statusState.isLocked) {
    throw new AppError("Account is temporarily locked. Try again later.", 423);
  }

  if (!user.isEmailVerified) {
    throw new AppError("Please verify your email before logging in", 403);
  }

  if (user.role === "DOCTOR" && user.doctorVerificationStatus !== "APPROVED") {
    throw new AppError("Doctor account is pending admin approval", 403);
  }

  const isPasswordCorrect = await comparePassword(password, user.passwordHash);

  if (!isPasswordCorrect) {
    user.failedLoginAttempts += 1;

    if (user.failedLoginAttempts >= 5) {
      user.accountStatus = "LOCKED";
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
    }

    await user.save();

    await createAuthLog({
      userId: user._id,
      email: user.email,
      action: "LOGIN_FAILED",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      metadata: {
        failedLoginAttempts: user.failedLoginAttempts
      }
    });

    throw new AppError("Invalid email or password", 401);
  }

  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  resolveAccountStatus(user);

  user.lastLoginAt = new Date();
  await user.save();

  await createAuthLog({
    userId: user._id,
    email: user.email,
    action: "LOGIN_SUCCESS",
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
    metadata: { role: user.role }
  });

  const { accessToken, refreshToken } = await issueTokens(user);

  return { user, accessToken, refreshToken };
};

export const getCurrentUser = async (userId, req) => {
  const user = await User.findById(userId).select("-passwordHash");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  await createAuthLog({
    userId: user._id,
    email: user.email,
    action: "PROFILE_VIEWED",
    ipAddress: req.ip,
    userAgent: req.get("user-agent")
  });

  return user;
};
