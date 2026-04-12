import { Router } from "express";
import protect from "../middlewares/auth.middleware.js";
import validateRequest from "../middlewares/validate.middleware.js";
import { handleGetNotificationPreferences, handleUpdateNotificationPreferences } from "../controllers/notification.controller.js";
import { updateNotificationPreferencesValidation } from "../validations/notification.validation.js";

const router = Router();

router.use(protect);
router.get("/preferences", handleGetNotificationPreferences);
router.patch("/preferences", updateNotificationPreferencesValidation, validateRequest, handleUpdateNotificationPreferences);

export default router;
