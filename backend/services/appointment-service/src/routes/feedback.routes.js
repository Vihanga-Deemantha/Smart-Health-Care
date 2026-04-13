import { Router } from "express";
import protect from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";
import validateRequest from "../middlewares/validate.middleware.js";
import { handleDoctorReviews, handleModerateFeedback, handleSubmitFeedback } from "../controllers/feedback.controller.js";
import { doctorReviewValidation, moderateFeedbackValidation, submitFeedbackValidation } from "../validations/feedback.validation.js";
import { USER_ROLES } from "../utils/constants.js";

const router = Router();

router.post("/", protect, allowRoles(USER_ROLES.PATIENT), submitFeedbackValidation, validateRequest, handleSubmitFeedback);
router.get("/doctors/:id/reviews", doctorReviewValidation, validateRequest, handleDoctorReviews);
router.patch(
  "/:id/moderate",
  protect,
  allowRoles(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.STAFF),
  moderateFeedbackValidation,
  validateRequest,
  handleModerateFeedback
);

export default router;
