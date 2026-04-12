import { Router } from "express";
import verifyInternalService from "../middlewares/internal.middleware.js";
import validateRequest from "../middlewares/validate.middleware.js";
import { handleGetPatientInternal } from "../controllers/patient.controller.js";
import { internalPatientValidation } from "../validations/patient.validation.js";

const router = Router();

router.use(verifyInternalService);

router.get("/patients/:patientId", internalPatientValidation, validateRequest, handleGetPatientInternal);

export default router;
