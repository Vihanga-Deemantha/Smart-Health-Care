import { body, query } from "express-validator";
import { ALERT_SEVERITY } from "../utils/constants.js";

export const createEmergencyAlertValidation = [
  body("appointmentId").isMongoId().withMessage("appointmentId must be valid"),
  body("severity")
    .isIn(Object.values(ALERT_SEVERITY))
    .withMessage(`severity must be one of ${Object.values(ALERT_SEVERITY).join(", ")}`),
  body("note").trim().notEmpty().isLength({ max: 2000 })
];

export const listEmergencyResourcesValidation = [
  query("category").optional().isIn(["HOSPITAL", "AMBULANCE", "HELPLINE", "POLICE", "FIRE"]),
  query("city").optional().trim().isString(),
  query("country").optional().trim().isString()
];
