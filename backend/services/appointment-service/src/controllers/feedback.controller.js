import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/apiResponse.js";
import { getDoctorReviews, moderateFeedback, submitFeedback } from "../services/feedback.service.js";

export const handleSubmitFeedback = asyncHandler(async (req, res) => {
  const feedback = await submitFeedback({
    ...req.body,
    patientId: req.user.userId
  });

  return sendResponse(res, 201, "Feedback submitted", feedback);
});

export const handleDoctorReviews = asyncHandler(async (req, res) => {
  const data = await getDoctorReviews({
    doctorId: req.params.id,
    page: req.query.page,
    limit: req.query.limit
  });

  return sendResponse(res, 200, "Doctor reviews fetched", data);
});

export const handleModerateFeedback = asyncHandler(async (req, res) => {
  const feedback = await moderateFeedback({
    feedbackId: req.params.id,
    moderationStatus: req.body.moderationStatus,
    actorId: req.user.userId,
    actorRole: req.user.role
  });

  return sendResponse(res, 200, "Feedback moderated", feedback);
});
