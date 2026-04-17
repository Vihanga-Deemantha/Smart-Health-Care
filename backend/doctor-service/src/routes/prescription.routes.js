import express from "express";
import protect from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";
import verifyInternalService from "../middlewares/internal.middleware.js";
import validateRequest from "../middlewares/validate.middleware.js";
import {
  handleCreatePrescription,
  handleGetPrescriptionByAppointment,
  handleListPrescriptionsForDoctor,
  handleListPrescriptionsForCurrentPatient,
  handleListPrescriptionsForPatient,
  handleUpdatePrescriptionByAppointment
} from "../controllers/doctor.controller.js";
import {
  createPrescriptionValidation,
  listDoctorPrescriptionsValidation,
  prescriptionAppointmentValidation,
  listPrescriptionsForPatientValidation,
  listPrescriptionsValidation,
  updatePrescriptionValidation
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
  "/appointment/:appointmentId",
  protect,
  allowRoles("DOCTOR"),
  prescriptionAppointmentValidation,
  validateRequest,
  handleGetPrescriptionByAppointment
);

router.patch(
  "/appointment/:appointmentId",
  protect,
  allowRoles("DOCTOR"),
  updatePrescriptionValidation,
  validateRequest,
  handleUpdatePrescriptionByAppointment
);

router.get(
  "/doctor",
  protect,
  allowRoles("DOCTOR"),
  listDoctorPrescriptionsValidation,
  validateRequest,
  handleListPrescriptionsForDoctor
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
