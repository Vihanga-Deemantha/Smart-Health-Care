import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  createSession,
  joinSession,
  endSession,
  cancelSession,
  getSession,
  getSessionByAppointment,
  getDoctorSessions,
  getPatientSessions,
  getInternalSessionByAppointment
} from "../controllers/sessionController.js";

const router = Router();

const verifyInternal = (req, res, next) => {
  const internalSecret = req.headers["x-internal-service-secret"];

  if (!internalSecret || internalSecret !== process.env.INTERNAL_SERVICE_SECRET) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized internal service access"
    });
  }

  return next();
};

router.get(
  "/api/sessions/doctor/my-sessions",
  protect,
  authorize("DOCTOR"),
  getDoctorSessions
);
router.get(
  "/api/sessions/patient/my-sessions",
  protect,
  authorize("PATIENT"),
  getPatientSessions
);
router.get(
  "/api/sessions/appointment/:appointmentId",
  protect,
  getSessionByAppointment
);
router.get("/api/sessions/:sessionId", protect, getSession);

router.post(
  "/api/sessions",
  protect,
  authorize("DOCTOR", "ADMIN"),
  createSession
);
router.post(
  "/api/sessions/:sessionId/join",
  protect,
  authorize("DOCTOR", "PATIENT"),
  joinSession
);
router.put(
  "/api/sessions/:sessionId/end",
  protect,
  authorize("DOCTOR", "PATIENT"),
  endSession
);
router.put(
  "/api/sessions/:sessionId/cancel",
  protect,
  authorize("ADMIN"),
  cancelSession
);

router.get(
  "/internal/sessions/appointment/:appointmentId",
  verifyInternal,
  getInternalSessionByAppointment
);

export default router;
