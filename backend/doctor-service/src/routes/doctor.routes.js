import express from "express";
import multer from "multer";
import protect from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";
import validateRequest from "../middlewares/validate.middleware.js";
import AppError from "../utils/AppError.js";
import {
  handleListDoctors,
  handleGetDoctor,
  handleCreateDoctor,
  handleUpdateAvailability,
  handleGetPatientReports,
  handleUpdateProfile,
  handleUploadDoctorProfilePhoto,
  handleUploadQualificationDocument
} from "../controllers/doctor.controller.js";
import {
  availabilityValidation,
  createDoctorValidation,
  doctorIdValidation,
  patientReportValidation,
  updateDoctorProfileValidation
} from "../validations/doctor.validation.js";

const router = express.Router();

const allowedQualificationTypes = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

const allowedProfilePhotoTypes = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);

const maxDocSizeMb = Number(process.env.DOCTOR_DOCUMENT_MAX_FILE_SIZE_MB || 10);
const maxPhotoSizeMb = Number(process.env.DOCTOR_PROFILE_PHOTO_MAX_FILE_SIZE_MB || 5);

const qualificationUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxDocSizeMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!allowedQualificationTypes.has(file.mimetype)) {
      cb(new AppError("Unsupported qualification file type", 400, "UNSUPPORTED_FILE_TYPE"));
      return;
    }

    cb(null, true);
  }
});

const profilePhotoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxPhotoSizeMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!allowedProfilePhotoTypes.has(file.mimetype)) {
      cb(new AppError("Unsupported profile photo type", 400, "UNSUPPORTED_FILE_TYPE"));
      return;
    }

    cb(null, true);
  }
});

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
router.post(
  "/:id/profile/photo",
  protect,
  allowRoles("DOCTOR"),
  doctorIdValidation,
  profilePhotoUpload.single("file"),
  handleUploadDoctorProfilePhoto
);
router.post(
  "/:id/qualifications/upload",
  protect,
  allowRoles("DOCTOR"),
  doctorIdValidation,
  qualificationUpload.single("file"),
  handleUploadQualificationDocument
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
