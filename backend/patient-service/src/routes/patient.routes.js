import { Router } from "express";
import multer from "multer";
import protect from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";
import validateRequest from "../middlewares/validate.middleware.js";
import AppError from "../utils/AppError.js";
import {
  handleCancelAppointment,
  handleConfirmAppointmentAttendance,
  handleDeleteReport,
  handleDownloadReport,
  handleGetAppointment,
  handleGetAppointments,
  handleGetHistory,
  handleGetPrescriptions,
  handleGetProfile,
  handleGetReports,
  handleUpdateProfile,
  handleUploadReport,
  handleRescheduleAppointment
} from "../controllers/patient.controller.js";
import {
  historyValidation,
  patientAppointmentCancelValidation,
  patientAppointmentConfirmValidation,
  patientAppointmentIdValidation,
  patientAppointmentListValidation,
  patientAppointmentRescheduleValidation,
  prescriptionsValidation,
  updateProfileValidation
} from "../validations/patient.validation.js";

const router = Router();

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

const maxFileSizeMb = Number(process.env.REPORT_MAX_FILE_SIZE_MB || 10);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxFileSizeMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      cb(new AppError("Unsupported report file type", 400, "UNSUPPORTED_FILE_TYPE"));
      return;
    }

    cb(null, true);
  }
});

router.use(protect, allowRoles("PATIENT"));

router.get("/profile", handleGetProfile);
router.put("/profile", updateProfileValidation, validateRequest, handleUpdateProfile);
router.post("/reports", upload.single("file"), handleUploadReport);
router.get("/reports", handleGetReports);
router.get("/reports/download", handleDownloadReport);
router.delete("/reports", handleDeleteReport);
router.get("/history", historyValidation, validateRequest, handleGetHistory);
router.get("/prescriptions", prescriptionsValidation, validateRequest, handleGetPrescriptions);
router.get("/appointments", patientAppointmentListValidation, validateRequest, handleGetAppointments);
router.get(
  "/appointments/:appointmentId",
  patientAppointmentIdValidation,
  validateRequest,
  handleGetAppointment
);
router.patch(
  "/appointments/:appointmentId/cancel",
  patientAppointmentCancelValidation,
  validateRequest,
  handleCancelAppointment
);
router.patch(
  "/appointments/:appointmentId/reschedule",
  patientAppointmentRescheduleValidation,
  validateRequest,
  handleRescheduleAppointment
);
router.patch(
  "/appointments/:appointmentId/confirm-attendance",
  patientAppointmentConfirmValidation,
  validateRequest,
  handleConfirmAppointmentAttendance
);

export default router;
