import { Router } from "express";
import protect from "../middlewares/auth.middleware.js";
import {
  handleCapturePayment,
  handleCreateCheckout,
  handleFailPayment,
  handleGetPaymentByAppointment
} from "../controllers/payment.controller.js";

const router = Router();

router.use(protect);
router.post("/checkout", handleCreateCheckout);
router.patch("/:id/capture", handleCapturePayment);
router.patch("/:id/fail", handleFailPayment);
router.get("/appointment/:appointmentId", handleGetPaymentByAppointment);

export default router;
