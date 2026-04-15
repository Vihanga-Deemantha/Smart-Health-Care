import { param, query } from "express-validator";
import { CONSULTATION_MODE } from "../utils/constants.js";

export const searchDoctorsValidation = [
  query("specialization").optional().trim().isString(),
  query("hospital").optional().trim().isString(),
  query("language").optional().trim().isString(),
  query("mode").optional().isIn(Object.values(CONSULTATION_MODE))
];

export const doctorAvailabilityValidation = [
  param("id").trim().notEmpty().withMessage("doctor id is required"),
  query("date").isISO8601().withMessage("date is required and must be ISO8601"),
  query("mode")
    .isIn(Object.values(CONSULTATION_MODE))
    .withMessage(`mode must be one of ${Object.values(CONSULTATION_MODE).join(", ")}`)
];
