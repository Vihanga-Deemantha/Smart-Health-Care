import express from "express";
import protect from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";
import validateRequest from "../middlewares/validate.middleware.js";
import {
  handleGetUsers,
  handleGetPendingDoctors,
  handleApproveDoctor,
  handleRejectDoctor,
  handleUpdateUserStatus,
  handleGetAdminActions,
  handleGetSecurityActivity
} from "../controllers/admin.controller.js";
import {
  rejectDoctorValidation,
  listSecurityActivityValidation,
  updateUserStatusValidation,
  listAdminActionsValidation
} from "../validations/admin.validation.js";

const router = express.Router();

router.use(protect, allowRoles("ADMIN"));

router.get("/users", handleGetUsers);
router.get("/doctors/pending", handleGetPendingDoctors);
router.patch("/doctors/:id/approve", handleApproveDoctor);
router.patch("/doctors/:id/reject", rejectDoctorValidation, validateRequest, handleRejectDoctor);
router.patch("/users/:id/status", updateUserStatusValidation, validateRequest, handleUpdateUserStatus);
router.get("/security/activity", listSecurityActivityValidation, validateRequest, handleGetSecurityActivity);
router.get("/actions", listAdminActionsValidation, validateRequest, handleGetAdminActions);

export default router;
