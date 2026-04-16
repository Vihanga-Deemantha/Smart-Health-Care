import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { createAuthLogSafely } from "./audit.service.js";
import { createAndSendOtp } from "./otp.service.js";
import {
  uploadDoctorVerificationBuffer,
  deleteDoctorVerificationDocuments
} from "./storage.service.js";
import { issueTokens } from "./token.service.js";
import {
  normalizeVerificationLinks,
  mapVerificationDocumentsToLegacyList
} from "../utils/doctorVerification.js";
import { normalizeSriLankanPhone } from "../utils/phone.js";

const normalizeEmail = (email = "") => email.trim().toLowerCase();
const normalizeIdentityType = (identityType = "") =>
  identityType.trim().toUpperCase();
const normalizePhone = (phone = "") =>
  normalizeSriLankanPhone(phone) || phone.trim();

const normalizePatientIdentity = (payload = {}) => {
  const identityType = normalizeIdentityType(payload.identityType || "");

  if (identityType === "NIC") {
    return {
      identityType,
      nic: payload.nic?.trim().toUpperCase() || null,
      passportNumber: undefined,
      nationality: null
    };
  }

  if (identityType === "PASSPORT") {
    return {
      identityType,
      nic: undefined,
      passportNumber: payload.passportNumber?.trim().toUpperCase() || null,
      nationality: payload.nationality?.trim() || null
    };
  }

  return {
    identityType: null,
    nic: undefined,
    passportNumber: undefined,
    nationality: null
  };
};

const buildUploadedVerificationDocuments = async (files) => {
  const uploadedDocuments = [];

  try {
    for (const file of Array.isArray(files) ? files : []) {
      const uploaded = await uploadDoctorVerificationBuffer({
        buffer: file.buffer,
        filename: file.originalname
      });

      uploadedDocuments.push({
        filename: file.originalname,
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt: new Date()
      });
    }

    return uploadedDocuments;
  } catch (error) {
    await deleteDoctorVerificationDocuments(uploadedDocuments).catch((cleanupError) => {
      console.error("[storage] Failed to rollback uploaded verification documents:", cleanupError);
    });
    throw error;
  }
};

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
  const { fullName, password } = payload;
  const email = normalizeEmail(payload.email);
  const phone = normalizePhone(payload.phone);
  const identity = normalizePatientIdentity(payload);

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError(
      existingUser.isEmailVerified
        ? "Email already registered. Please sign in instead."
        : "An account with this email already exists but is not verified yet. Please verify your email or resend the OTP.",
      409
    );
  }

  if (identity.nic) {
    const existingNicUser = await User.findOne({ nic: identity.nic });

    if (existingNicUser) {
      throw new AppError("This NIC number is already linked to another account", 409);
    }
  }

  if (identity.passportNumber) {
    const existingPassportUser = await User.findOne({
      passportNumber: identity.passportNumber
    });

    if (existingPassportUser) {
      throw new AppError(
        "This passport number is already linked to another account",
        409
      );
    }
  }

  const passwordHash = await hashPassword(password);

  const user = await User.create({
    fullName,
    email,
    phone,
    passwordHash,
    role: "PATIENT",
    accountStatus: "PENDING",
    doctorVerificationStatus: "NOT_REQUIRED",
    ...identity
  });

  await createAuthLogSafely({
    userId: user._id,
    email: user.email,
    action: "REGISTERED",
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
    metadata: { role: user.role }
  }, `patient registration log for ${user.email}`);

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

export const registerDoctor = async (payload, files, req) => {
  const {
    fullName,
    email,
    phone,
    password,
    medicalLicenseNumber,
    specialization,
    yearsOfExperience
  } = payload;
  const normalizedEmail = normalizeEmail(email);
  const verificationLinks = normalizeVerificationLinks(payload.verificationLinks);

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
  let uploadedDocuments = [];
  let user = null;

  try {
    uploadedDocuments = await buildUploadedVerificationDocuments(files);

    user = await User.create({
      fullName,
      email: normalizedEmail,
      phone: normalizePhone(phone),
      passwordHash,
      role: "DOCTOR",
      accountStatus: "PENDING",
      doctorVerificationStatus: "PENDING",
      medicalLicenseNumber,
      specialization,
      yearsOfExperience: yearsOfExperience || 0,
      qualificationDocuments: mapVerificationDocumentsToLegacyList(
        uploadedDocuments,
        verificationLinks
      ),
      verificationDocuments: uploadedDocuments,
      verificationLinks
    });

    await createAuthLogSafely({
      userId: user._id,
      email: user.email,
      action: "REGISTERED",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      metadata: {
        role: user.role,
        verificationDocumentCount: uploadedDocuments.length,
        verificationLinkCount: verificationLinks.length
      }
    }, `doctor registration log for ${user.email}`);

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
  } catch (error) {
    if (!user) {
      await deleteDoctorVerificationDocuments(uploadedDocuments).catch((cleanupError) => {
        console.error(
          "[storage] Failed to cleanup doctor verification documents after registration error:",
          cleanupError
        );
      });
    }

    throw error;
  }
};

export const resubmitDoctorVerification = async (userId, payload, files, req) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.role !== "DOCTOR") {
    throw new AppError("Only doctor accounts can resubmit verification", 403);
  }

  if (!["CHANGES_REQUESTED", "REJECTED"].includes(user.doctorVerificationStatus)) {
    throw new AppError("Doctor verification re-submission is not available right now", 400);
  }

  const verificationLinks = normalizeVerificationLinks(payload.verificationLinks);
  const previousVerificationDocuments = user.verificationDocuments || [];
  let uploadedDocuments = [];

  try {
    uploadedDocuments = await buildUploadedVerificationDocuments(files);

    if (!uploadedDocuments.length && !verificationLinks.length) {
      throw new AppError(
        "Upload at least one verification document or provide at least one verification link",
        400
      );
    }

    user.verificationDocuments = uploadedDocuments;
    user.verificationLinks = verificationLinks;
    user.qualificationDocuments = mapVerificationDocumentsToLegacyList(
      uploadedDocuments,
      verificationLinks
    );
    user.doctorVerificationStatus = "PENDING";
    user.doctorReviewedBy = null;
    user.doctorReviewedAt = null;
    user.doctorRejectionReason = null;
    user.accountStatus = "PENDING";

    await user.save();

    await createAuthLogSafely({
      userId: user._id,
      email: user.email,
      action: "DOCTOR_VERIFICATION_RESUBMITTED",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      metadata: {
        verificationDocumentCount: uploadedDocuments.length,
        verificationLinkCount: verificationLinks.length
      }
    }, `doctor verification resubmission log for ${user.email}`);

    await deleteDoctorVerificationDocuments(previousVerificationDocuments).catch(
      (cleanupError) => {
        console.error(
          "[storage] Failed to cleanup replaced verification documents:",
          cleanupError
        );
      }
    );
  } catch (error) {
    await deleteDoctorVerificationDocuments(uploadedDocuments).catch((cleanupError) => {
      console.error(
        "[storage] Failed to cleanup uploaded verification documents after resubmission error:",
        cleanupError
      );
    });
    throw error;
  }

  return user;
};

export const loginUser = async ({ email, password }, req) => {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    await createAuthLogSafely({
      email: normalizedEmail,
      action: "LOGIN_FAILED",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      metadata: { reason: "User not found" }
    }, `failed login log for ${normalizedEmail}`);

    throw new AppError("Invalid email or password", 401);
  }

  const statusState = resolveAccountStatus(user);

  if (statusState.isSuspended) {
    await createAuthLogSafely({
      userId: user._id,
      email: user.email,
      action: "LOGIN_FAILED",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      metadata: { reason: "Account suspended" }
    }, `suspended login log for ${user.email}`);
    throw new AppError("Account is suspended", 403);
  }

  if (statusState.isLocked) {
    await createAuthLogSafely({
      userId: user._id,
      email: user.email,
      action: "LOGIN_FAILED",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      metadata: { reason: "Account locked" }
    }, `locked login log for ${user.email}`);
    throw new AppError("Account is temporarily locked. Try again later.", 423);
  }

  if (!user.isEmailVerified) {
    await createAuthLogSafely({
      userId: user._id,
      email: user.email,
      action: "LOGIN_FAILED",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      metadata: { reason: "Email not verified" }
    }, `unverified login log for ${user.email}`);
    throw new AppError("Please verify your email before logging in", 403);
  }

  const isPasswordCorrect = await comparePassword(password, user.passwordHash);

  if (!isPasswordCorrect) {
    user.failedLoginAttempts += 1;

    if (user.failedLoginAttempts >= 5) {
      user.accountStatus = "LOCKED";
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
    }

    await user.save();

    await createAuthLogSafely({
      userId: user._id,
      email: user.email,
      action: "LOGIN_FAILED",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      metadata: {
        failedLoginAttempts: user.failedLoginAttempts
      }
    }, `failed login log for ${user.email}`);

    throw new AppError("Invalid email or password", 401);
  }

  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  resolveAccountStatus(user);

  if (user.role === "DOCTOR" && user.doctorVerificationStatus !== "APPROVED") {
    if (["CHANGES_REQUESTED", "REJECTED"].includes(user.doctorVerificationStatus)) {
      user.lastLoginAt = new Date();
      await user.save();

      await createAuthLogSafely({
        userId: user._id,
        email: user.email,
        action: "LOGIN_SUCCESS",
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        metadata: {
          role: user.role,
          restrictedDoctorAccess: true
        }
      }, `restricted doctor login log for ${user.email}`);

      const message = user.doctorRejectionReason
        ? `Doctor verification needs updates: ${user.doctorRejectionReason}`
        : "Doctor verification needs updated documents before approval";

      const { accessToken, refreshToken } = await issueTokens(user);

      return {
        user,
        accessToken,
        refreshToken,
        restrictedDoctorAccess: true,
        loginMessage: message
      };
    }

    throw new AppError("Doctor account is pending admin approval", 403);
  }

  user.lastLoginAt = new Date();
  await user.save();

  await createAuthLogSafely({
    userId: user._id,
    email: user.email,
    action: "LOGIN_SUCCESS",
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
    metadata: { role: user.role }
  }, `login success log for ${user.email}`);

  const { accessToken, refreshToken } = await issueTokens(user);

  return { user, accessToken, refreshToken };
};

export const getCurrentUser = async (userId, req) => {
  const user = await User.findById(userId).select("-passwordHash");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  await createAuthLogSafely({
    userId: user._id,
    email: user.email,
    action: "PROFILE_VIEWED",
    ipAddress: req.ip,
    userAgent: req.get("user-agent")
  }, `profile viewed log for ${user.email}`);

  return user;
};
