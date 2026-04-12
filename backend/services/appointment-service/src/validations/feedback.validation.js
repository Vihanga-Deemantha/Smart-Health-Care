import { body, param, query } from "express-validator";

export const submitFeedbackValidation = [
  body("appointmentId").isMongoId().withMessage("appointmentId must be valid"),
  body("rating").isInt({ min: 1, max: 5 }).withMessage("rating must be between 1 and 5"),
  body("review").optional().trim().isLength({ max: 2000 }),
  body("isAnonymous").optional().isBoolean()
];

export const doctorReviewValidation = [
  param("id").trim().notEmpty().withMessage("doctor id is required"),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 })
];

export const moderateFeedbackValidation = [
  param("id").isMongoId().withMessage("Invalid feedback id"),
  body("moderationStatus")
    .isIn(["VISIBLE", "HIDDEN", "FLAGGED", "DELETED"])
    .withMessage("Invalid moderation status")
];
