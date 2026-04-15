import { body, param } from "express-validator";

export const respondAppointmentValidation = [
  param("id").isMongoId().withMessage("Invalid appointment id"),
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

export const appointmentIdValidation = [
  param("id").isMongoId().withMessage("Invalid appointment id")
];
