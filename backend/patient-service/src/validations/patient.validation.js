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

export const patientAppointmentListValidation = [
  query("status").optional().isString(),
  query("from").optional().isISO8601().withMessage("from must be a valid date"),
  query("to").optional().isISO8601().withMessage("to must be a valid date"),
  query("page").optional().isInt({ min: 1 }).withMessage("page must be >= 1"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100")
];

export const patientAppointmentIdValidation = [
  param("appointmentId").isMongoId().withMessage("Invalid appointment id")
];

export const patientAppointmentCancelValidation = [
  ...patientAppointmentIdValidation,
  body("reason").trim().notEmpty().withMessage("reason is required"),
  body("overridePolicy").optional().isBoolean().withMessage("overridePolicy must be boolean")
];

export const patientAppointmentRescheduleValidation = [
  ...patientAppointmentIdValidation,
  body("newStartTime").isISO8601().withMessage("newStartTime must be a valid date"),
  body("newEndTime").isISO8601().withMessage("newEndTime must be a valid date")
];

export const patientAppointmentConfirmValidation = [...patientAppointmentIdValidation];
