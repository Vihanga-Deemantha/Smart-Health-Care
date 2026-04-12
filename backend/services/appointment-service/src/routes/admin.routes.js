import { Router } from "express";
import protect from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";
import validateRequest from "../middlewares/validate.middleware.js";
import { USER_ROLES } from "../utils/constants.js";
import { adminAnalyticsValidation } from "../validations/admin.validation.js";
import { handleAdminAnalytics } from "../controllers/admin.controller.js";

const router = Router();

router.get(
  "/analytics",
  protect,
  allowRoles(USER_ROLES.ADMIN, USER_ROLES.STAFF),
  adminAnalyticsValidation,
  validateRequest,
  handleAdminAnalytics
);

export default router;
