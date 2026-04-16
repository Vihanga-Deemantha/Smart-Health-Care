import express from "express";
import protect from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";
import validateRequest from "../middlewares/validate.middleware.js";
import {
  handleRespondToAppointment,
  handleGetTelemedicineSession,
  handleListDoctorAppointments
} from "../controllers/doctor.controller.js";
import {
  listDoctorAppointmentsValidation,
  respondAppointmentValidation,
  appointmentIdValidation
} from "../validations/appointment.validation.js";

const router = express.Router();

router.get(
  "/doctor/:doctorId",
  protect,
  allowRoles("DOCTOR"),
  listDoctorAppointmentsValidation,
  validateRequest,
  handleListDoctorAppointments
);

router.patch(
  "/:id/respond",
  protect,
  allowRoles("DOCTOR"),
  respondAppointmentValidation,
  validateRequest,
  handleRespondToAppointment
);

router.get(
  "/:id/telemedicine",
  protect,
  allowRoles("DOCTOR"),
  appointmentIdValidation,
  validateRequest,
  handleGetTelemedicineSession
);

export default router;
