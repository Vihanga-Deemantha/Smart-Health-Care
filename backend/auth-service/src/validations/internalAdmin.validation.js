import { body, header, param, query } from "express-validator";
import { normalizeSriLankanPhone } from "../utils/phone.js";

const sanitizePhone = (value) => normalizeSriLankanPhone(value) || String(value || "").trim();

export const getCurrentAdminProfileInternalValidation = [
  query("adminUserId")
    .trim()
    .notEmpty()
    .withMessage("adminUserId is required")
    .isMongoId()
    .withMessage("adminUserId must be a valid id")
];

export const listAdminsInternalValidation = [
  query("adminUserId")
    .trim()
    .notEmpty()
    .withMessage("adminUserId is required")
    .isMongoId()
    .withMessage("adminUserId must be a valid id"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be between 1 and 100"),
  query("search")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("search must be between 1 and 100 characters")
];

export const createAdminInternalValidation = [
  body("adminUserId")
    .trim()
    .notEmpty()
    .withMessage("adminUserId is required")
    .isMongoId()
    .withMessage("adminUserId must be a valid id"),
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
    .customSanitizer((value) => sanitizePhone(value))
    .notEmpty()
    .withMessage("Phone number is required")
    .custom((value) => {
      if (!normalizeSriLankanPhone(value)) {
        throw new Error("Phone number must be a valid Sri Lankan mobile number");
      }

      return true;
    }),
  body("jobTitle")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Job title must be between 2 and 80 characters"),
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

export const deleteAdminInternalValidation = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Admin id is required")
    .isMongoId()
    .withMessage("Admin id must be a valid id"),
  body("adminUserId")
    .trim()
    .notEmpty()
    .withMessage("adminUserId is required")
    .isMongoId()
    .withMessage("adminUserId must be a valid id")
];

export const updateCurrentAdminProfileInternalValidation = [
  body("adminUserId")
    .trim()
    .notEmpty()
    .withMessage("adminUserId is required")
    .isMongoId()
    .withMessage("adminUserId must be a valid id"),
  body("fullName")
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage("Full name must be at least 3 characters"),
  body("phone")
    .optional()
    .customSanitizer((value) => sanitizePhone(value))
    .custom((value) => {
      if (!normalizeSriLankanPhone(value)) {
        throw new Error("Phone number must be a valid Sri Lankan mobile number");
      }

      return true;
    }),
  body("jobTitle")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Job title must be between 2 and 80 characters"),
  body().custom((_, { req }) => {
    const hasUpdatableField =
      typeof req.body.fullName === "string" ||
      typeof req.body.phone === "string" ||
      typeof req.body.jobTitle === "string";

    if (!hasUpdatableField) {
      throw new Error("Provide at least one profile field to update");
    }

    return true;
  })
];

export const updateCurrentAdminProfilePhotoInternalValidation = [
  header("x-admin-user-id")
    .trim()
    .notEmpty()
    .withMessage("x-admin-user-id is required")
    .isMongoId()
    .withMessage("x-admin-user-id must be a valid id")
];

export const changeCurrentAdminPasswordInternalValidation = [
  body("adminUserId")
    .trim()
    .notEmpty()
    .withMessage("adminUserId is required")
    .isMongoId()
    .withMessage("adminUserId must be a valid id"),
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("New password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("New password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("New password must contain at least one number")
    .matches(/[^A-Za-z0-9]/)
    .withMessage("New password must contain at least one special character")
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error("New password must be different from the current password");
      }

      return true;
    })
];

export const approveDoctorInternalValidation = [
  body("adminUserId")
    .trim()
    .notEmpty()
    .withMessage("adminUserId is required")
    .isMongoId()
    .withMessage("adminUserId must be a valid id")
];

export const rejectDoctorInternalValidation = [
  body("adminUserId")
    .trim()
    .notEmpty()
    .withMessage("adminUserId is required")
    .isMongoId()
    .withMessage("adminUserId must be a valid id"),
  body("reason")
    .trim()
    .notEmpty()
    .withMessage("Rejection reason is required")
    .isLength({ min: 3, max: 500 })
    .withMessage("Reason must be between 3 and 500 characters")
];

export const updateUserStatusInternalValidation = [
  body("adminUserId")
    .trim()
    .notEmpty()
    .withMessage("adminUserId is required")
    .isMongoId()
    .withMessage("adminUserId must be a valid id"),
  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["ACTIVE", "SUSPENDED"])
    .withMessage("Invalid account status")
    .custom((status, { req }) => {
      const reason = req.body.reason?.trim();

      if (status === "SUSPENDED" && !reason) {
        throw new Error("Suspension reason is required");
      }

      return true;
    }),
  body("reason")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage("Reason must be between 3 and 500 characters")
];

export const listAuthLogsInternalValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage("limit must be between 1 and 500"),
  query("action")
    .optional()
    .isIn([
      "REGISTERED",
      "LOGIN_SUCCESS",
      "LOGIN_FAILED",
      "PROFILE_VIEWED",
      "OTP_SENT",
      "OTP_VERIFIED",
      "PASSWORD_RESET_REQUESTED",
      "PASSWORD_RESET_SUCCESS",
      "DOCTOR_VERIFICATION_RESUBMITTED",
      "DOCTOR_APPROVED",
      "DOCTOR_CHANGES_REQUESTED",
      "ADMIN_CREATED",
      "ADMIN_DELETED",
      "ADMIN_PROFILE_UPDATED",
      "ADMIN_PROFILE_PHOTO_UPDATED",
      "ADMIN_PROFILE_PHOTO_REMOVED",
      "ADMIN_PASSWORD_CHANGED",
      "ACCOUNT_SUSPENDED",
      "ACCOUNT_ACTIVATED"
    ])
    .withMessage("Invalid auth log action"),
  query("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("email must be valid"),
  query("userId")
    .optional()
    .trim()
    .isMongoId()
    .withMessage("userId must be a valid id")
];

