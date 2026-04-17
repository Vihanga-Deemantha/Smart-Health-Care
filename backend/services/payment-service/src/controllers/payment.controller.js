import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/apiResponse.js";
import {
  capturePayment,
  createCheckoutSession,
  failPayment,
  getPaymentByAppointment,
  processStripeWebhook
} from "../services/payment.service.js";
import AppError from "../utils/AppError.js";

export const handleCreateCheckout = asyncHandler(async (req, res) => {
  const patientId = req.user?.userId || req.user?.id || req.user?._id || req.user?.sub;

  if (!patientId) {
    throw new AppError("Unable to identify authenticated user", 401, "UNAUTHORIZED");
  }

  const payment = await createCheckoutSession({
    ...req.body,
    patientId,
    actor: req.user
  });

  return sendResponse(res, 201, "Checkout created", payment);
});

export const handleCapturePayment = asyncHandler(async (req, res) => {
  if (String(req.user?.role || "").toUpperCase() === "PATIENT") {
    throw new AppError(
      "Manual capture is not allowed for patients. Complete payment through Stripe checkout.",
      403,
      "PAYMENT_CAPTURE_FORBIDDEN"
    );
  }

  const payment = await capturePayment({
    paymentId: req.params.id,
    actor: req.user
  });

  return sendResponse(res, 200, "Payment captured", payment);
});

export const handleFailPayment = asyncHandler(async (req, res) => {
  if (String(req.user?.role || "").toUpperCase() === "PATIENT") {
    throw new AppError(
      "Manual fail is not allowed for patients.",
      403,
      "PAYMENT_FAIL_FORBIDDEN"
    );
  }

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

export const handleStripeWebhook = async (req, res, next) => {
  try {
    const signature = req.headers["stripe-signature"];
    const result = await processStripeWebhook({
      signature,
      rawBody: req.body
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
