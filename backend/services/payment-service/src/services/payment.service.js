import { v4 as uuidv4 } from "uuid";
import Payment from "../models/Payment.js";
import AppError from "../utils/AppError.js";
import { publishEvent } from "../events/publishers/eventPublisher.js";

export const createCheckoutSession = async ({ appointmentId, patientId, doctorId, amount, currency }) => {
  const payment = await Payment.create({
    appointmentId,
    patientId,
    doctorId,
    amount,
    currency,
    status: "PENDING",
    providerPaymentId: `pay_${uuidv4()}`
  });

  await publishEvent("payment.checkout.created", {
    paymentId: payment._id.toString(),
    appointmentId,
    patientId,
    doctorId,
    amount,
    currency
  });

  return payment;
};

export const capturePayment = async ({ paymentId, actor }) => {
  const payment = await Payment.findById(paymentId);

  if (!payment) {
    throw new AppError("Payment not found", 404, "PAYMENT_NOT_FOUND");
  }

  payment.status = "CAPTURED";
  payment.metadata.capturedBy = actor.userId;
  await payment.save();

  await publishEvent("payment.captured", {
    paymentId: payment._id.toString(),
    appointmentId: payment.appointmentId,
    patientId: payment.patientId,
    doctorId: payment.doctorId,
    amount: payment.amount,
    currency: payment.currency
  });

  await publishEvent("notification.payment.captured", {
    paymentId: payment._id.toString(),
    appointmentId: payment.appointmentId,
    patientId: payment.patientId,
    amount: payment.amount,
    currency: payment.currency
  });

  return payment;
};

export const failPayment = async ({ paymentId, reason }) => {
  const payment = await Payment.findById(paymentId);

  if (!payment) {
    throw new AppError("Payment not found", 404, "PAYMENT_NOT_FOUND");
  }

  payment.status = "FAILED";
  payment.metadata.failureReason = reason;
  await payment.save();

  await publishEvent("payment.failed", {
    paymentId: payment._id.toString(),
    appointmentId: payment.appointmentId,
    patientId: payment.patientId,
    reason
  });

  return payment;
};

export const getPaymentByAppointment = async (appointmentId) => {
  return Payment.findOne({ appointmentId }).lean();
};
