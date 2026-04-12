import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/apiResponse.js";
import {
  setRefreshTokenCookie,
  clearRefreshTokenCookie
} from "../utils/cookies.js";
import {
  registerPatient,
  registerDoctor,
  resubmitDoctorVerification,
  loginUser,
  getCurrentUser
} from "../services/auth.service.js";
import {
  rotateRefreshToken,
  revokeRefreshToken
} from "../services/token.service.js";
import {
  verifyEmailOtp,
  resendEmailOtp,
  forgotPassword,
  resetPassword
} from "../services/otp.service.js";

export const handleRegisterPatient = asyncHandler(async (req, res) => {
  const { user, otpSent } = await registerPatient(req.body, req);

  sendResponse(
    res,
    201,
    otpSent
      ? "Patient registered successfully. Please check your email for the OTP."
      : "Patient registered successfully, but OTP delivery is pending. Please use resend OTP shortly.",
    {
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
      isEmailVerified: user.isEmailVerified
    },
    otpSent
  }
  );
});

export const handleRegisterDoctor = asyncHandler(async (req, res) => {
  const { user, otpSent } = await registerDoctor(req.body, req.files, req);

  sendResponse(
    res,
    201,
    otpSent
      ? "Doctor registered successfully. Please check your email for the OTP."
      : "Doctor registered successfully, but OTP delivery is pending. Please use resend OTP shortly.",
    {
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
      doctorVerificationStatus: user.doctorVerificationStatus,
      doctorRejectionReason: user.doctorRejectionReason,
      isEmailVerified: user.isEmailVerified
    },
    otpSent
  }
  );
});

export const handleResubmitDoctorVerification = asyncHandler(async (req, res) => {
  const user = await resubmitDoctorVerification(req.user.userId, req.body, req.files, req);

  sendResponse(res, 200, "Doctor verification re-submitted successfully", {
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
      doctorVerificationStatus: user.doctorVerificationStatus,
      doctorRejectionReason: user.doctorRejectionReason,
      isEmailVerified: user.isEmailVerified,
      medicalLicenseNumber: user.medicalLicenseNumber,
      specialization: user.specialization,
      yearsOfExperience: user.yearsOfExperience,
      verificationDocuments: user.verificationDocuments,
      verificationLinks: user.verificationLinks
    }
  });
});

export const handleLogin = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken, restrictedDoctorAccess, loginMessage } = await loginUser(req.body, req);

  setRefreshTokenCookie(res, refreshToken);

  sendResponse(res, 200, "Login successful", {
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
      doctorVerificationStatus: user.doctorVerificationStatus,
      doctorRejectionReason: user.doctorRejectionReason,
      isEmailVerified: user.isEmailVerified,
      medicalLicenseNumber: user.medicalLicenseNumber,
      specialization: user.specialization,
      yearsOfExperience: user.yearsOfExperience,
      verificationDocuments: user.verificationDocuments,
      verificationLinks: user.verificationLinks
    },
    accessToken,
    restrictedDoctorAccess: Boolean(restrictedDoctorAccess),
    loginMessage: loginMessage || null
  });
});

export const handleMe = asyncHandler(async (req, res) => {
  const user = await getCurrentUser(req.user.userId, req);

  sendResponse(res, 200, "Current user fetched successfully", { user });
});

export const handleVerifyEmailOtp = asyncHandler(async (req, res) => {
  await verifyEmailOtp(req.body, req);
  sendResponse(res, 200, "Email verified successfully");
});

export const handleResendEmailOtp = asyncHandler(async (req, res) => {
  await resendEmailOtp(req.body);
  sendResponse(res, 200, "OTP resent successfully");
});

export const handleForgotPassword = asyncHandler(async (req, res) => {
  await forgotPassword(req.body);
  sendResponse(res, 200, "Password reset OTP sent successfully");
});

export const handleResetPassword = asyncHandler(async (req, res) => {
  await resetPassword(req.body, req);
  sendResponse(res, 200, "Password reset successfully");
});

export const handleRefreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken;

  const { user, accessToken, refreshToken } = await rotateRefreshToken(
    incomingRefreshToken
  );

  setRefreshTokenCookie(res, refreshToken);

  sendResponse(res, 200, "Token refreshed successfully", {
    accessToken,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
      doctorVerificationStatus: user.doctorVerificationStatus,
      doctorRejectionReason: user.doctorRejectionReason,
      isEmailVerified: user.isEmailVerified,
      medicalLicenseNumber: user.medicalLicenseNumber,
      specialization: user.specialization,
      yearsOfExperience: user.yearsOfExperience,
      verificationDocuments: user.verificationDocuments,
      verificationLinks: user.verificationLinks
    }
  });
});

export const handleLogout = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken;

  await revokeRefreshToken(incomingRefreshToken);
  clearRefreshTokenCookie(res);

  sendResponse(res, 200, "Logout successful");
});
