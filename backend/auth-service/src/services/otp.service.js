import Otp from "../models/Otp.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import {
  sendOtpEmail,
  sendPatientWelcomeEmail,
  sendEmailSafely
} from "./email.service.js";
import { createAuthLogSafely } from "./audit.service.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { revokeAllUserRefreshTokens } from "./token.service.js";

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const getOtpCooldownSeconds = () => {
  const value = Number(process.env.OTP_RESEND_COOLDOWN_SECONDS);
  return Number.isFinite(value) && value > 0 ? value : 60;
};

const getOtpRateLimitWindowMinutes = () => {
  const value = Number(process.env.OTP_RATE_LIMIT_WINDOW_MINUTES);
  return Number.isFinite(value) && value > 0 ? value : 15;
};

const getOtpRateLimitMax = () => {
  const value = Number(process.env.OTP_RATE_LIMIT_MAX);
  return Number.isFinite(value) && value > 0 ? value : 5;
};

const getOtpMaxVerifyAttempts = () => {
  const value = Number(process.env.OTP_MAX_VERIFY_ATTEMPTS);
  return Number.isFinite(value) && value > 0 ? value : 5;
};

const getOtpAttemptBlockMinutes = () => {
  const value = Number(process.env.OTP_ATTEMPT_BLOCK_MINUTES);
  return Number.isFinite(value) && value > 0 ? value : 15;
};

const enforceOtpCooldown = async ({ email, purpose }) => {
  const cooldownSeconds = getOtpCooldownSeconds();

  const latest = await Otp.findOne({ email, purpose }).sort({ createdAt: -1 });
  if (!latest) return;

  const secondsSinceLast = Math.floor((Date.now() - latest.createdAt.getTime()) / 1000);
  const retryAfter = cooldownSeconds - secondsSinceLast;

  if (retryAfter > 0) {
    throw new AppError(
      `Please wait ${retryAfter}s before requesting another OTP`,
      429
    );
  }
};

const enforceOtpRateLimit = async ({ email, purpose }) => {
  const windowMinutes = getOtpRateLimitWindowMinutes();
  const maxRequests = getOtpRateLimitMax();
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

  const count = await Otp.countDocuments({
    email,
    purpose,
    createdAt: { $gte: windowStart }
  });

  if (count >= maxRequests) {
    throw new AppError(
      `Too many OTP requests. Try again in ${windowMinutes} minutes.`,
      429
    );
  }
};

const getLatestOtpDoc = async ({ email, purpose }) => {
  return Otp.findOne({
    email,
    purpose,
    used: false
  }).sort({ createdAt: -1 });
};

const enforceOtpAttemptBlock = (otpDoc) => {
  if (!otpDoc?.blockedUntil) return;

  if (otpDoc.blockedUntil > new Date()) {
    throw new AppError("Too many wrong OTP attempts. Try again later.", 429);
  }

  otpDoc.blockedUntil = null;
  otpDoc.failedAttempts = 0;
};

const validateOtpOrFail = async ({ otpDoc, otpCode }) => {
  if (!otpDoc) {
    throw new AppError("OTP not found", 404);
  }

  enforceOtpAttemptBlock(otpDoc);

  if (otpDoc.expiresAt < new Date()) {
    throw new AppError("OTP expired", 400);
  }

  const isOtpValid = await comparePassword(otpCode, otpDoc.otpCode);

  if (isOtpValid) {
    otpDoc.failedAttempts = 0;
    otpDoc.blockedUntil = null;
    return;
  }

  otpDoc.failedAttempts += 1;

  const maxAttempts = getOtpMaxVerifyAttempts();
  if (otpDoc.failedAttempts >= maxAttempts) {
    otpDoc.blockedUntil = new Date(
      Date.now() + getOtpAttemptBlockMinutes() * 60 * 1000
    );
  }

  await otpDoc.save();

  if (otpDoc.blockedUntil && otpDoc.blockedUntil > new Date()) {
    throw new AppError("Too many wrong OTP attempts. Try again later.", 429);
  }

  throw new AppError("Invalid OTP", 400);
};

export const createAndSendOtp = async (email, purpose) => {
  const normalizedEmail = email.toLowerCase().trim();

  await enforceOtpCooldown({ email: normalizedEmail, purpose });
  await enforceOtpRateLimit({ email: normalizedEmail, purpose });

  // Keep history for rate limiting; invalidate any previous unused OTPs.
  await Otp.updateMany(
    { email: normalizedEmail, purpose, used: false },
    { $set: { used: true } }
  );

  const otpCode = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  const otpHash = await hashPassword(otpCode);

  const otpDoc = await Otp.create({
    email: normalizedEmail,
    purpose,
    otpCode: otpHash,
    expiresAt,
    failedAttempts: 0,
    blockedUntil: null
  });

  try {
    await sendOtpEmail(normalizedEmail, otpCode, purpose);
  } catch (error) {
    await Otp.deleteOne({ _id: otpDoc._id });
    throw new AppError(
      "Your account was created, but we could not send the OTP right now. Please use resend OTP in a moment.",
      503
    );
  }

  await createAuthLogSafely({
    email: normalizedEmail,
    action: "OTP_SENT",
    metadata: { purpose }
  }, `otp sent log for ${normalizedEmail}`);
};

export const verifyEmailOtp = async ({ email, otpCode }, req) => {
  const normalizedEmail = email.toLowerCase().trim();

  const otpDoc = await getLatestOtpDoc({
    email: normalizedEmail,
    purpose: "EMAIL_VERIFY"
  });

  await validateOtpOrFail({ otpDoc, otpCode });

  otpDoc.used = true;
  await otpDoc.save();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) throw new AppError("User not found", 404);

  user.isEmailVerified = true;

  if (user.role === "PATIENT") {
    user.accountStatus = "ACTIVE";
  } else if (user.role === "DOCTOR") {
    user.accountStatus = "PENDING";
  } else if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
    user.accountStatus = "ACTIVE";
  }

  await user.save();

  await createAuthLogSafely({
    userId: user._id,
    email: user.email,
    action: "OTP_VERIFIED",
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
    metadata: { purpose: "EMAIL_VERIFY" }
  }, `otp verified log for ${user.email}`);

  if (user.role === "PATIENT") {
    await sendEmailSafely(
      () =>
        sendPatientWelcomeEmail({
          email: user.email,
          fullName: user.fullName
        }),
      `patient welcome email for ${user.email}`
    );
  }

  return user;
};

export const resendEmailOtp = async ({ email }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) throw new AppError("User not found", 404);
  if (user.isEmailVerified) throw new AppError("Email already verified", 400);

  await createAndSendOtp(normalizedEmail, "EMAIL_VERIFY");
};

export const forgotPassword = async ({ email }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) throw new AppError("User not found", 404);

  await createAndSendOtp(normalizedEmail, "PASSWORD_RESET");

  await createAuthLogSafely({
    userId: user._id,
    email: normalizedEmail,
    action: "PASSWORD_RESET_REQUESTED"
  }, `password reset requested log for ${normalizedEmail}`);
};
export const resetPassword = async ({ email, otpCode, newPassword }, req) => {
  const normalizedEmail = email.toLowerCase().trim();

  const otpDoc = await getLatestOtpDoc({
    email: normalizedEmail,
    purpose: "PASSWORD_RESET"
  });

  await validateOtpOrFail({ otpDoc, otpCode });

  otpDoc.used = true;
  await otpDoc.save();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) throw new AppError("User not found", 404);

  user.passwordHash = await hashPassword(newPassword);
  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  await user.save();

  await revokeAllUserRefreshTokens(user._id);

  await createAuthLogSafely({
    userId: user._id,
    email: user.email,
    action: "PASSWORD_RESET_SUCCESS",
    ipAddress: req.ip,
    userAgent: req.get("user-agent")
  }, `password reset success log for ${user.email}`);

  return true;
};
