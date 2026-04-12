import { body } from "express-validator";

export const updateNotificationPreferencesValidation = [
  body("smsEnabled").optional().isBoolean(),
  body("whatsappEnabled").optional().isBoolean(),
  body("emailEnabled").optional().isBoolean(),
  body("timezone").optional().trim().isString(),
  body("locale").optional().trim().isString()
];
