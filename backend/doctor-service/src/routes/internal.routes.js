import express from "express";
import verifyInternalService from "../middlewares/internal.middleware.js";
import validateRequest from "../middlewares/validate.middleware.js";
import {
  handleGetInternalDoctor,
  handleListInternalDoctors
} from "../controllers/doctor.controller.js";
import { doctorIdValidation } from "../validations/doctor.validation.js";

const router = express.Router();

router.use(verifyInternalService);

router.get("/doctors", handleListInternalDoctors);
router.get("/doctors/:id", doctorIdValidation, validateRequest, handleGetInternalDoctor);

export default router;
