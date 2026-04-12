import { body, query } from "express-validator";

export const rejectDoctorValidation = [
  body("reason")
    .trim()
    .notEmpty()
    .withMessage("Rejection reason is required")
    .isLength({ min: 3, max: 500 })
    .withMessage("Reason must be between 3 and 500 characters")
];

export const updateUserStatusValidation = [
  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["ACTIVE", "SUSPENDED"])
    .withMessage("Status must be ACTIVE or SUSPENDED")
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

export const listAdminActionsValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be between 1 and 100"),
  query("action")
    .optional()
    .isIn([
      "DOCTOR_APPROVED",
      "DOCTOR_REJECTED",
      "DOCTOR_CHANGES_REQUESTED",
      "USER_SUSPENDED",
      "USER_ACTIVATED"
    ])
    .withMessage("Invalid admin action")
];

export const listSecurityActivityValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be between 1 and 100")
];

