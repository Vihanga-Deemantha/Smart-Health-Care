import express from "express";
import verifyInternalService from "../middlewares/internal.middleware.js";
import validateRequest from "../middlewares/validate.middleware.js";
import {
  handleGetAuthLogsInternal,
  handleGetUsersInternal,
  handleGetPendingDoctorsInternal,
  handleApproveDoctorInternal,
  handleRejectDoctorInternal,
  handleUpdateUserStatusInternal,
  handleGetDashboardCountsInternal
} from "../controllers/internalAdmin.controller.js";
import {
  approveDoctorInternalValidation,
  listAuthLogsInternalValidation,
  rejectDoctorInternalValidation,
  updateUserStatusInternalValidation
} from "../validations/internalAdmin.validation.js";

const router = express.Router();

router.use(verifyInternalService);

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
