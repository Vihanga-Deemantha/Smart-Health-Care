import { body, param, query } from "express-validator";
import { CONSULTATION_MODE } from "../utils/constants.js";

export const holdSlotValidation = [
  body("doctorId").trim().notEmpty().withMessage("doctorId is required"),
  body("startTime").isISO8601().withMessage("startTime must be ISO8601 date"),
  body("endTime").isISO8601().withMessage("endTime must be ISO8601 date")
];

export const bookAppointmentValidation = [
  body("holdId").trim().notEmpty().withMessage("holdId is required"),
  body("doctorId").trim().notEmpty().withMessage("doctorId is required"),
  body("mode")
    .isIn(Object.values(CONSULTATION_MODE))
    .withMessage(`mode must be one of ${Object.values(CONSULTATION_MODE).join(", ")}`),
  body("hospitalId").optional().trim().isString(),
  body("reason").optional().trim().isLength({ max: 500 }).withMessage("reason can be max 500 characters")
];

export const cancelAppointmentValidation = [
  param("id").isMongoId().withMessage("Invalid appointment id"),
  body("reason").trim().notEmpty().withMessage("reason is required"),
  body("overridePolicy").optional().isBoolean().withMessage("overridePolicy must be boolean")
];

export const rescheduleAppointmentValidation = [
  param("id").isMongoId().withMessage("Invalid appointment id"),
  body("newStartTime").isISO8601().withMessage("newStartTime must be ISO8601 date"),
  body("newEndTime").isISO8601().withMessage("newEndTime must be ISO8601 date")
];

export const confirmAttendanceValidation = [param("id").isMongoId().withMessage("Invalid appointment id")];

export const completeAppointmentValidation = [
  param("id").isMongoId().withMessage("Invalid appointment id")
];

export const markNoShowValidation = [
  param("id").isMongoId().withMessage("Invalid appointment id"),
  body("target").isIn(["PATIENT", "DOCTOR"]).withMessage("target must be PATIENT or DOCTOR")
];

export const listAppointmentsValidation = [
  query("status").optional().isString(),
  query("from").optional().isISO8601(),
  query("to").optional().isISO8601(),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 })
];

export const appointmentIdValidation = [
  param("id").isMongoId().withMessage("Invalid appointment id")
];

export const respondAppointmentValidation = [
  param("id").isMongoId().withMessage("Invalid appointment id"),
  body("action")
    .customSanitizer((value) => String(value || "").toUpperCase())
    .isIn(["ACCEPT", "REJECT"])
    .withMessage("action must be ACCEPT or REJECT"),
  body("reason").custom((value, { req }) => {
    const action = String(req.body.action || "").toUpperCase();
    if (action === "REJECT" && !value) {
      throw new Error("reason is required when rejecting an appointment");
    }

    return true;
  })
];
