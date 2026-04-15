import { Router } from "express";
import validateRequest from "../middlewares/validate.middleware.js";
import { handleListEmergencyResources } from "../controllers/emergency.controller.js";
import { listEmergencyResourcesValidation } from "../validations/emergency.validation.js";

const router = Router();

router.get("/", listEmergencyResourcesValidation, validateRequest, handleListEmergencyResources);

export default router;
