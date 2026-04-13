import express from "express";
import multer from "multer";
import verifyInternalService from "../middlewares/internal.middleware.js";
import validateRequest from "../middlewares/validate.middleware.js";
import AppError from "../utils/AppError.js";
import {
  handleGetCurrentAdminProfileInternal,
  handleUpdateCurrentAdminProfileInternal,
  handleUploadCurrentAdminProfilePhotoInternal,
  handleRemoveCurrentAdminProfilePhotoInternal,
  handleChangeCurrentAdminPasswordInternal,
  handleGetAuthLogsInternal,
  handleGetAdminsInternal,
  handleCreateAdminInternal,
  handleDeleteAdminInternal,
  handleGetUsersInternal,
  handleGetPendingDoctorsInternal,
  handleApproveDoctorInternal,
  handleRejectDoctorInternal,
  handleUpdateUserStatusInternal,
  handleGetDashboardCountsInternal
} from "../controllers/internalAdmin.controller.js";
import {
  approveDoctorInternalValidation,
  changeCurrentAdminPasswordInternalValidation,
  createAdminInternalValidation,
  deleteAdminInternalValidation,
  getCurrentAdminProfileInternalValidation,
  updateCurrentAdminProfilePhotoInternalValidation,
  listAdminsInternalValidation,
  listAuthLogsInternalValidation,
  rejectDoctorInternalValidation,
  updateCurrentAdminProfileInternalValidation,
  updateUserStatusInternalValidation
} from "../validations/internalAdmin.validation.js";

const router = express.Router();
const allowedAdminProfilePhotoTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp"
]);
const maxAdminProfilePhotoSizeMb = Number(
  process.env.ADMIN_PROFILE_PHOTO_MAX_FILE_SIZE_MB || 5
);
const adminProfilePhotoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxAdminProfilePhotoSizeMb * 1024 * 1024,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (!allowedAdminProfilePhotoTypes.has(file.mimetype)) {
      cb(
        new AppError(
          "Unsupported admin profile photo file type",
          400,
          "UNSUPPORTED_FILE_TYPE"
        )
      );
      return;
    }

    cb(null, true);
  }
});

router.use(verifyInternalService);

router.get(
  "/admins/me",
  getCurrentAdminProfileInternalValidation,
  validateRequest,
  handleGetCurrentAdminProfileInternal
);
router.patch(
  "/admins/me",
  updateCurrentAdminProfileInternalValidation,
  validateRequest,
  handleUpdateCurrentAdminProfileInternal
);
router.post(
  "/admins/me/photo",
  adminProfilePhotoUpload.single("profilePhoto"),
  updateCurrentAdminProfilePhotoInternalValidation,
  validateRequest,
  handleUploadCurrentAdminProfilePhotoInternal
);
router.delete(
  "/admins/me/photo",
  updateCurrentAdminProfilePhotoInternalValidation,
  validateRequest,
  handleRemoveCurrentAdminProfilePhotoInternal
);
router.patch(
  "/admins/me/password",
  changeCurrentAdminPasswordInternalValidation,
  validateRequest,
  handleChangeCurrentAdminPasswordInternal
);
router.get("/admins", listAdminsInternalValidation, validateRequest, handleGetAdminsInternal);
router.post("/admins", createAdminInternalValidation, validateRequest, handleCreateAdminInternal);
router.delete(
  "/admins/:id",
  deleteAdminInternalValidation,
  validateRequest,
  handleDeleteAdminInternal
);
router.get("/users", handleGetUsersInternal);
router.get("/auth-logs", listAuthLogsInternalValidation, validateRequest, handleGetAuthLogsInternal);
router.get("/doctors/pending", handleGetPendingDoctorsInternal);
router.patch(
  "/doctors/:id/approve",
  approveDoctorInternalValidation,
  validateRequest,
  handleApproveDoctorInternal
);
router.patch(
  "/doctors/:id/reject",
  rejectDoctorInternalValidation,
  validateRequest,
  handleRejectDoctorInternal
);
router.patch(
  "/users/:id/status",
  updateUserStatusInternalValidation,
  validateRequest,
  handleUpdateUserStatusInternal
);
router.get("/dashboard/counts", handleGetDashboardCountsInternal);

export default router;
