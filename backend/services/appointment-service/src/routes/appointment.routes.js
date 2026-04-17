import { Router } from "express";
import protect from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";
import validateRequest from "../middlewares/validate.middleware.js";
import {
  bookAppointmentValidation,
  cancelAppointmentValidation,
  confirmAttendanceValidation,
  completeAppointmentValidation,
  holdSlotValidation,
  listAppointmentsValidation,
  appointmentIdValidation,
  respondAppointmentValidation,
  markNoShowValidation,
  rescheduleAppointmentValidation
} from "../validations/appointment.validation.js";
import {
  handleCancelAppointment,
  handleConfirmAttendance,
  handleCompleteAppointment,
  handleCreateAppointment,
  handleCreateHold,
  handleGetAppointment,
  handleGetTelemedicineSession,
  handleListAppointments,
  handleRespondToAppointment,
  handleNoShow,
  handleRescheduleAppointment
} from "../controllers/appointment.controller.js";
import { USER_ROLES } from "../utils/constants.js";

const router = Router();

router.use(protect);

router.get(
  "/",
  allowRoles(
    USER_ROLES.PATIENT,
    USER_ROLES.DOCTOR,
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.STAFF
  ),
  listAppointmentsValidation,
  validateRequest,
  handleListAppointments
);
router.get(
  "/:id",
  allowRoles(
    USER_ROLES.PATIENT,
    USER_ROLES.DOCTOR,
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.STAFF
  ),
  appointmentIdValidation,
  validateRequest,
  handleGetAppointment
);
router.patch(
  "/:id/respond",
  allowRoles(USER_ROLES.DOCTOR),
  respondAppointmentValidation,
  validateRequest,
  handleRespondToAppointment
);
router.get(
  "/:id/telemedicine",
  allowRoles(USER_ROLES.DOCTOR, USER_ROLES.PATIENT),
  appointmentIdValidation,
  validateRequest,
  handleGetTelemedicineSession
);
router.post("/hold", allowRoles(USER_ROLES.PATIENT), holdSlotValidation, validateRequest, handleCreateHold);
router.post("/", allowRoles(USER_ROLES.PATIENT), bookAppointmentValidation, validateRequest, handleCreateAppointment);
router.patch(
  "/:id/cancel",
  allowRoles(
    USER_ROLES.PATIENT,
    USER_ROLES.DOCTOR,
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.STAFF
  ),
  cancelAppointmentValidation,
  validateRequest,
  handleCancelAppointment
);
router.patch(
  "/:id/reschedule",
  allowRoles(USER_ROLES.PATIENT, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.STAFF),
  rescheduleAppointmentValidation,
  validateRequest,
  handleRescheduleAppointment
);
router.patch(
  "/:id/confirm-attendance",
  allowRoles(USER_ROLES.PATIENT, USER_ROLES.DOCTOR),
  confirmAttendanceValidation,
  validateRequest,
  handleConfirmAttendance
);
router.patch(
  "/:id/complete",
  allowRoles(USER_ROLES.DOCTOR, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.STAFF),
  completeAppointmentValidation,
  validateRequest,
  handleCompleteAppointment
);
router.patch(
  "/:id/no-show",
  allowRoles(USER_ROLES.DOCTOR, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.STAFF),
  markNoShowValidation,
  validateRequest,
  handleNoShow
);

export default router;
