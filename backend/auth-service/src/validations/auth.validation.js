import { body } from "express-validator";

export const registerPatientValidation = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 3 })
    .withMessage("Full name must be at least 3 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .isLength({ min: 10, max: 15 })
    .withMessage("Phone number must be between 10 and 15 characters"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[^A-Za-z0-9]/)
    .withMessage("Password must contain at least one special character")
];

export const registerDoctorValidation = [
  ...registerPatientValidation,
  body("medicalLicenseNumber")
    .trim()
    .notEmpty()
    .withMessage("Medical license number is required"),
  body("specialization").trim().notEmpty().withMessage("Specialization is required"),
  body("yearsOfExperience")
    .optional()
    .isNumeric()
    .withMessage("Years of experience must be a number"),
  body("qualificationDocuments")
    .optional()
    .isArray()
    .withMessage("Qualification documents must be an array")
];

export const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required")
];

export const verifyEmailOtpValidation = [
  body("email").trim().notEmpty().isEmail().normalizeEmail(),
  body("otpCode")
    .trim()
    .notEmpty()
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits")
];

export const resendOtpValidation = [
  body("email").trim().notEmpty().isEmail().normalizeEmail()
];

export const forgotPasswordValidation = [
  body("email").trim().notEmpty().isEmail().normalizeEmail()
];

export const resetPasswordValidation = [
  body("email").trim().notEmpty().isEmail().normalizeEmail(),
  body("otpCode")
    .trim()
    .notEmpty()
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits"),
  body("newPassword")
    .notEmpty()
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters")
];
