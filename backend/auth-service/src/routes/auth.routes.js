import express from "express";
import {
  handleRegisterPatient,
  handleRegisterDoctor,
  handleLogin,
  handleMe,
  handleVerifyEmailOtp,
  handleResendEmailOtp,
  handleForgotPassword,
  handleResetPassword,
  handleRefreshToken,
  handleLogout
} from "../controllers/auth.controller.js";
import protect from "../middlewares/auth.middleware.js";
import validateRequest from "../middlewares/validate.middleware.js";
import {
  loginValidation,
  registerDoctorValidation,
  registerPatientValidation,
  verifyEmailOtpValidation,
  resendOtpValidation,
  forgotPasswordValidation,
  resetPasswordValidation
} from "../validations/auth.validation.js";

const router = express.Router();

router.post(
  "/register/patient",
  registerPatientValidation,
  validateRequest,
  handleRegisterPatient
);
router.post(
  "/register/doctor",
  registerDoctorValidation,
  validateRequest,
  handleRegisterDoctor
);
router.post("/login", loginValidation, validateRequest, handleLogin);
router.get("/me", protect, handleMe);

router.post(
  "/verify-email-otp",
  verifyEmailOtpValidation,
  validateRequest,
  handleVerifyEmailOtp
);

router.post(
  "/resend-email-otp",
  resendOtpValidation,
  validateRequest,
  handleResendEmailOtp
);

router.post(
  "/forgot-password",
  forgotPasswordValidation,
  validateRequest,
  handleForgotPassword
);

router.post(
  "/reset-password",
  resetPasswordValidation,
  validateRequest,
  handleResetPassword
);

router.post("/refresh-token", handleRefreshToken);
router.post("/logout", handleLogout);

export default router;
