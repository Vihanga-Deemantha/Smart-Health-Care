import { body } from "express-validator";

export const joinWaitlistValidation = [
  body("doctorId").trim().notEmpty().withMessage("doctorId is required"),
  body("mode").isIn(["IN_PERSON", "TELEMEDICINE"]).withMessage("Invalid mode"),
  body("preferredFrom").isISO8601().withMessage("preferredFrom must be ISO date"),
  body("preferredTo").isISO8601().withMessage("preferredTo must be ISO date"),
  body("priority").optional().isInt({ min: 0, max: 10 })
];
