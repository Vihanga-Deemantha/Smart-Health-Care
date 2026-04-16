import { body, param, query } from "express-validator";

export const respondAppointmentActionValidation = [
  body("action")
    .trim()
    .isIn(["ACCEPT", "REJECT"])
    .withMessage("action must be ACCEPT or REJECT"),
  body("reason").custom((value, { req }) => {
    if (req.body.action === "REJECT" && !value) {
      throw new Error("reason is required when rejecting an appointment");
    }

    return true;
  })
];

export const respondAppointmentValidation = [
  param("id").isMongoId().withMessage("Invalid appointment id"),
  ...respondAppointmentActionValidation
];

export const appointmentIdValidation = [
  param("id").isMongoId().withMessage("Invalid appointment id")
];

export const doctorAppointmentIdValidation = [
  param("appointmentId").isMongoId().withMessage("Invalid appointment id")
];

export const listDoctorAppointmentsValidation = [
  query("status").optional().isString(),
  query("from").optional().isISO8601().withMessage("from must be a valid date"),
  query("to").optional().isISO8601().withMessage("to must be a valid date"),
  query("page").optional().isInt({ min: 1 }).withMessage("page must be >= 1"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100")
];

export const cancelAppointmentValidation = [
  ...doctorAppointmentIdValidation,
  body("reason").trim().notEmpty().withMessage("reason is required"),
  body("overridePolicy").optional().isBoolean().withMessage("overridePolicy must be boolean")
];

export const confirmAttendanceValidation = [...doctorAppointmentIdValidation];

export const noShowValidation = [
  ...doctorAppointmentIdValidation,
  body("target")
    .optional()
    .isIn(["PATIENT", "DOCTOR"])
    .withMessage("target must be PATIENT or DOCTOR")
];
