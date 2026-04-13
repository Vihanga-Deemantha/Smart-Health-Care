import { body, param, query } from "express-validator";

export const listAdminsValidation = [
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

export const updateCurrentAdminProfileValidation = [
  body("fullName")
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage("Full name must be at least 3 characters"),
  body("phone")
    .optional()
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage("Phone number must be between 10 and 15 characters"),
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

export const changeCurrentAdminPasswordValidation = [
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

export const createAdminValidation = [
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

export const deleteAdminValidation = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Admin id is required")
    .isMongoId()
    .withMessage("Admin id must be a valid id")
];

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
      "ADMIN_CREATED",
      "ADMIN_DELETED",
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

