import express from "express";
import protect from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";
import verifyInternalService from "../middlewares/internal.middleware.js";
import validateRequest from "../middlewares/validate.middleware.js";
import {
  handleCreatePrescription,
  handleListPrescriptionsForPatient
} from "../controllers/doctor.controller.js";
import {
  createPrescriptionValidation,
  listPrescriptionsForPatientValidation
} from "../validations/prescription.validation.js";

const router = express.Router();

router.post(
  "/",
  protect,
  allowRoles("DOCTOR"),
  createPrescriptionValidation,
  validateRequest,
  handleCreatePrescription
);

router.get(
  "/patient/:patientId",
  verifyInternalService,
  listPrescriptionsForPatientValidation,
  validateRequest,
  handleListPrescriptionsForPatient
);

export default router;
