import express from "express";
import protect from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";
import validateRequest from "../middlewares/validate.middleware.js";
import {
  handleListDoctors,
  handleGetDoctor,
  handleCreateDoctor,
  handleUpdateAvailability,
  handleGetPatientReports,
  handleUpdateProfile
} from "../controllers/doctor.controller.js";
import {
  availabilityValidation,
  createDoctorValidation,
  doctorIdValidation,
  patientReportValidation,
  updateDoctorProfileValidation
} from "../validations/doctor.validation.js";

const router = express.Router();

router.get("/", handleListDoctors);
router.patch(
  "/:id/profile",
  protect,
  allowRoles("DOCTOR"),
  doctorIdValidation,
  updateDoctorProfileValidation,
  validateRequest,
  handleUpdateProfile
);
router.patch(
  "/:id/availability",
  protect,
  allowRoles("DOCTOR"),
  doctorIdValidation,
  availabilityValidation,
  validateRequest,
  handleUpdateAvailability
);
router.get(
  "/:id/patient-reports/:patientId",
  protect,
  allowRoles("DOCTOR"),
  doctorIdValidation,
  patientReportValidation,
  validateRequest,
  handleGetPatientReports
);
router.get("/:id", doctorIdValidation, validateRequest, handleGetDoctor);
router.post("/", createDoctorValidation, validateRequest, handleCreateDoctor);

export default router;
