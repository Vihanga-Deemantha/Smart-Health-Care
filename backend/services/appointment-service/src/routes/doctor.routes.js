import { Router } from "express";
import { handleDoctorAvailability, handleSearchDoctors } from "../controllers/doctor.controller.js";
import validateRequest from "../middlewares/validate.middleware.js";
import { doctorAvailabilityValidation, searchDoctorsValidation } from "../validations/doctor.validation.js";

const router = Router();

router.get("/", searchDoctorsValidation, validateRequest, handleSearchDoctors);
router.get("/:id/availability", doctorAvailabilityValidation, validateRequest, handleDoctorAvailability);

export default router;
