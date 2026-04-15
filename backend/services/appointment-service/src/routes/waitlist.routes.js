import { Router } from "express";
import protect from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";
import validateRequest from "../middlewares/validate.middleware.js";
import { handleJoinWaitlist } from "../controllers/waitlist.controller.js";
import { joinWaitlistValidation } from "../validations/waitlist.validation.js";
import { USER_ROLES } from "../utils/constants.js";

const router = Router();

router.post("/", protect, allowRoles(USER_ROLES.PATIENT), joinWaitlistValidation, validateRequest, handleJoinWaitlist);

export default router;
