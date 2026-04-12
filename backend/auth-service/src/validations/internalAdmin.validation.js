import { body, query } from "express-validator";

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

