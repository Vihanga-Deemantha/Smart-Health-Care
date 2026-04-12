import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/apiResponse.js";
import {
  capturePayment,
  createCheckoutSession,
  failPayment,
  getPaymentByAppointment
} from "../services/payment.service.js";

export const handleCreateCheckout = asyncHandler(async (req, res) => {
  const payment = await createCheckoutSession(req.body);
  return sendResponse(res, 201, "Checkout created", payment);
});

export const handleCapturePayment = asyncHandler(async (req, res) => {
  const payment = await capturePayment({
    paymentId: req.params.id,
    actor: req.user
  });

  return sendResponse(res, 200, "Payment captured", payment);
});

export const handleFailPayment = asyncHandler(async (req, res) => {
  const payment = await failPayment({
    paymentId: req.params.id,
    reason: req.body.reason
  });

  return sendResponse(res, 200, "Payment marked as failed", payment);
});

export const handleGetPaymentByAppointment = asyncHandler(async (req, res) => {
  const payment = await getPaymentByAppointment(req.params.appointmentId);
  return sendResponse(res, 200, "Payment fetched", payment);
});
