import { body, param, query } from "express-validator";

export const createPrescriptionValidation = [
  body("patientId").isMongoId().withMessage("patientId must be a valid id"),
  body("appointmentId").isMongoId().withMessage("appointmentId must be a valid id"),
  body("medicines")
    .isArray({ min: 1 })
    .withMessage("medicines must be a non-empty array"),
  body("medicines.*.name")
    .trim()
    .notEmpty()
    .withMessage("medicine name is required"),
  body("medicines.*.dose").optional().trim().isString(),
  body("medicines.*.frequency").optional().trim().isString(),
  body("medicines.*.duration").optional().trim().isString(),
  body("medicines.*.notes").optional().trim().isString()
];

export const listPrescriptionsForPatientValidation = [
  param("patientId").isMongoId().withMessage("patientId must be a valid id"),
  query("limit").optional().isInt({ min: 1, max: 200 })
];

export const listPrescriptionsValidation = [
  query("limit").optional().isInt({ min: 1, max: 200 })
];
