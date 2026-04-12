import { body, param, query } from "express-validator";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const updateProfileValidation = [
  body("fullName").optional().trim().isLength({ min: 2, max: 120 }),
  body("email").optional().trim().isEmail().withMessage("email must be valid"),
  body("dateOfBirth").optional({ values: "null" }).isISO8601().withMessage("dateOfBirth must be a valid date"),
  body("bloodGroup")
    .optional({ values: "null" })
    .isIn(bloodGroups)
    .withMessage(`bloodGroup must be one of ${bloodGroups.join(", ")}`),
  body("contactNumber").optional({ values: "null" }).trim().isLength({ min: 6, max: 20 }),
  body("address").optional({ values: "null" }).trim().isLength({ min: 5, max: 300 }),
  body("allergies").optional().isArray().withMessage("allergies must be an array"),
  body("allergies.*").optional().isString().trim().isLength({ min: 1, max: 120 }),
  body("medicalNotes").optional({ values: "null" }).trim().isLength({ max: 2000 })
];

export const historyValidation = [
  query("page").optional().isInt({ min: 1 }).withMessage("page must be >= 1"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100"),
  query("status").optional().isString()
];

export const prescriptionsValidation = [
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100")
];

export const internalPatientValidation = [
  param("patientId").trim().notEmpty().withMessage("patientId is required")
];
