import { body } from "express-validator";

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
  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["ACTIVE", "SUSPENDED", "PENDING", "LOCKED"])
    .withMessage("Invalid account status")
];

