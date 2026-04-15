import { Router } from "express";
import protect from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";
import validateRequest from "../middlewares/validate.middleware.js";
import { handleCreateEmergencyAlert } from "../controllers/emergency.controller.js";
import { createEmergencyAlertValidation } from "../validations/emergency.validation.js";
import { USER_ROLES } from "../utils/constants.js";

const router = Router();

router.post(
  "/",
  protect,
  allowRoles(USER_ROLES.DOCTOR, USER_ROLES.STAFF, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  createEmergencyAlertValidation,
  validateRequest,
  handleCreateEmergencyAlert
);

export default router;
