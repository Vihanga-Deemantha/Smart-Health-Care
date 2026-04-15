import { query } from "express-validator";

export const adminAnalyticsValidation = [
  query("from").optional().isISO8601(),
  query("to").optional().isISO8601()
];
