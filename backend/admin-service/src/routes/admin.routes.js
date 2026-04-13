import express from "express";
import protect from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";
import validateRequest from "../middlewares/validate.middleware.js";
import {
  handleGetCurrentAdminProfile,
  handleUpdateCurrentAdminProfile,
  handleUploadCurrentAdminProfilePhoto,
  handleRemoveCurrentAdminProfilePhoto,
  handleChangeCurrentAdminPassword,
  handleGetAdmins,
  handleCreateAdmin,
  handleDeleteAdmin,
  handleGetUsers,
  handleGetPendingDoctors,
  handleApproveDoctor,
  handleRejectDoctor,
  handleUpdateUserStatus,
  handleGetAdminActions,
  handleGetSecurityActivity
} from "../controllers/admin.controller.js";
import {
  updateCurrentAdminProfileValidation,
  changeCurrentAdminPasswordValidation,
  listAdminsValidation,
  createAdminValidation,
  deleteAdminValidation,
  rejectDoctorValidation,
  listSecurityActivityValidation,
  updateUserStatusValidation,
  listAdminActionsValidation
} from "../validations/admin.validation.js";

const router = express.Router();

router.use(protect, allowRoles("ADMIN", "SUPER_ADMIN"));

router.get("/profile", handleGetCurrentAdminProfile);
router.patch(
  "/profile",
  updateCurrentAdminProfileValidation,
  validateRequest,
  handleUpdateCurrentAdminProfile
);
router.post("/profile/photo", handleUploadCurrentAdminProfilePhoto);
router.delete("/profile/photo", handleRemoveCurrentAdminProfilePhoto);
router.patch(
  "/profile/password",
  changeCurrentAdminPasswordValidation,
  validateRequest,
  handleChangeCurrentAdminPassword
);
router.get("/admins", allowRoles("SUPER_ADMIN"), listAdminsValidation, validateRequest, handleGetAdmins);
router.post("/admins", allowRoles("SUPER_ADMIN"), createAdminValidation, validateRequest, handleCreateAdmin);
router.delete(
  "/admins/:id",
  allowRoles("SUPER_ADMIN"),
  deleteAdminValidation,
  validateRequest,
  handleDeleteAdmin
);
router.get("/users", handleGetUsers);
router.get("/doctors/pending", handleGetPendingDoctors);
router.patch("/doctors/:id/approve", handleApproveDoctor);
router.patch("/doctors/:id/reject", rejectDoctorValidation, validateRequest, handleRejectDoctor);
router.patch("/users/:id/status", updateUserStatusValidation, validateRequest, handleUpdateUserStatus);
router.get("/security/activity", listSecurityActivityValidation, validateRequest, handleGetSecurityActivity);
router.get("/actions", listAdminActionsValidation, validateRequest, handleGetAdminActions);

export default router;
