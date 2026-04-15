import express from "express";
import multer from "multer";
import {
  handleRegisterPatient,
  handleRegisterDoctor,
  handleResubmitDoctorVerification,
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
import allowRoles from "../middlewares/role.middleware.js";
import validateRequest from "../middlewares/validate.middleware.js";
import AppError from "../utils/AppError.js";
import {
  loginValidation,
  registerDoctorValidation,
  registerPatientValidation,
  resubmitDoctorVerificationValidation,
  verifyEmailOtpValidation,
  resendOtpValidation,
  forgotPasswordValidation,
  resetPasswordValidation
} from "../validations/auth.validation.js";

const router = express.Router();

const allowedDoctorDocumentTypes = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

const maxDoctorDocumentSizeMb = Number(
  process.env.DOCTOR_DOCUMENT_MAX_FILE_SIZE_MB || 10
);

const doctorUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxDoctorDocumentSizeMb * 1024 * 1024,
    files: 5
  },
  fileFilter: (req, file, cb) => {
    if (!allowedDoctorDocumentTypes.has(file.mimetype)) {
      cb(
        new AppError(
          "Unsupported doctor verification file type",
          400,
          "UNSUPPORTED_FILE_TYPE"
        )
      );
      return;
    }

    cb(null, true);
  }
});

router.post(
  "/register/patient",
  registerPatientValidation,
  validateRequest,
  handleRegisterPatient
);
router.post(
  "/register/doctor",
  doctorUpload.array("verificationFiles", 5),
  registerDoctorValidation,
  validateRequest,
  handleRegisterDoctor
);
router.post(
  "/doctor/verification/resubmit",
  protect,
  allowRoles("DOCTOR"),
  doctorUpload.array("verificationFiles", 5),
  resubmitDoctorVerificationValidation,
  validateRequest,
  handleResubmitDoctorVerification
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
