import express from "express";
import protect from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";
import verifyInternalService from "../middlewares/internal.middleware.js";
import validateRequest from "../middlewares/validate.middleware.js";
import {
  handleCreatePrescription,
  handleListPrescriptionsForCurrentPatient,
  handleListPrescriptionsForPatient
} from "../controllers/doctor.controller.js";
import {
  createPrescriptionValidation,
  listPrescriptionsForPatientValidation,
  listPrescriptionsValidation
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
  "/",
  protect,
  allowRoles("PATIENT"),
  listPrescriptionsValidation,
  validateRequest,
  handleListPrescriptionsForCurrentPatient
);

router.get(
  "/patient/:patientId",
  verifyInternalService,
  listPrescriptionsForPatientValidation,
  validateRequest,
  handleListPrescriptionsForPatient
);

export default router;
