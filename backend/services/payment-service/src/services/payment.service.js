import Payment from "../models/Payment.js";
import { randomUUID } from "crypto";
import AppError from "../utils/AppError.js";
import { publishEvent } from "../events/publishers/eventPublisher.js";
import { getStripeClient } from "../integrations/stripe.client.js";

const resolveClientUrl = () => process.env.CLIENT_URL || "http://localhost:8080";

const normalizeCurrency = (currency = "USD") => String(currency).trim().toUpperCase();

const buildPatientSummary = (source, patientId) => ({
  userId: source?.userId || source?._id || source?.id || patientId || null,
  fullName: source?.fullName || source?.name || "Patient",
  email: source?.email || null,
  phone: source?.phone || source?.contactNumber || null
});

const buildPaymentNotificationPayload = (payment, patientProfile) => ({
  eventId: randomUUID(),
  occurredAt: new Date().toISOString(),
  paymentId: payment._id.toString(),
  appointmentId: payment.appointmentId,
  patientId: payment.patientId,
  doctorId: payment.doctorId,
  amount: payment.amount,
  currency: payment.currency,
  patient: buildPatientSummary(patientProfile, payment.patientId)
});

const validateCheckoutPayload = ({ appointmentId, patientId, doctorId, amount, currency }) => {
  if (!appointmentId || !patientId || !doctorId) {
    throw new AppError("appointmentId, patientId and doctorId are required", 400, "INVALID_CHECKOUT_PAYLOAD");
  }

  const normalizedAmount = Number(amount);

  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new AppError("amount must be greater than zero", 400, "INVALID_CHECKOUT_AMOUNT");
  }

  return {
    appointmentId,
    patientId,
    doctorId,
    amount: normalizedAmount,
    currency: normalizeCurrency(currency)
  };
};

const publishCapturedEvents = async (payment) => {
  const patientProfile = payment?.metadata?.patient || null;

  await publishEvent("payment.captured", {
    paymentId: payment._id.toString(),
    appointmentId: payment.appointmentId,
    patientId: payment.patientId,
    doctorId: payment.doctorId,
    amount: payment.amount,
    currency: payment.currency
  });

  await publishEvent("notification.payment.captured", buildPaymentNotificationPayload(payment, patientProfile));
};

const wasWebhookProcessed = (payment, eventId) => {
  if (!eventId) {
    return false;
  }

  return Array.isArray(payment.webhookEvents) && payment.webhookEvents.includes(eventId);
};

const addWebhookEventId = (payment, eventId) => {
  if (!eventId) {
    return;
  }

  const currentIds = Array.isArray(payment.webhookEvents) ? payment.webhookEvents : [];
  if (!currentIds.includes(eventId)) {
    payment.webhookEvents = [...currentIds, eventId];
  }
};

const capturePaymentFromWebhook = async ({ payment, eventId, providerPaymentId }) => {
  if (!payment) {
    return null;
  }

  if (wasWebhookProcessed(payment, eventId)) {
    return payment;
  }

  const shouldPublish = payment.status !== "CAPTURED";
  payment.status = "CAPTURED";
  payment.providerPaymentId = providerPaymentId || payment.providerPaymentId;
  payment.metadata = {
    ...(payment.metadata || {}),
    capturedAt: new Date().toISOString(),
    captureSource: "STRIPE_WEBHOOK"
  };
  addWebhookEventId(payment, eventId);
  await payment.save();

  if (shouldPublish) {
    await publishCapturedEvents(payment);
  }

  return payment;
};

const failPaymentFromWebhook = async ({ payment, eventId, reason, providerPaymentId }) => {
  if (!payment) {
    return null;
  }

  if (wasWebhookProcessed(payment, eventId)) {
    return payment;
  }

  if (payment.status !== "CAPTURED") {
    payment.status = "FAILED";
  }

  payment.providerPaymentId = providerPaymentId || payment.providerPaymentId;
  payment.metadata = {
    ...(payment.metadata || {}),
    failureReason: reason || "Payment failed",
    failedAt: new Date().toISOString(),
    failureSource: "STRIPE_WEBHOOK"
  };

  addWebhookEventId(payment, eventId);
  await payment.save();

  await publishEvent("payment.failed", {
    paymentId: payment._id.toString(),
    appointmentId: payment.appointmentId,
    patientId: payment.patientId,
    reason: reason || "Payment failed"
  });

  return payment;
};

const findPaymentForStripeEvent = async (payload) => {
  const paymentId = payload?.metadata?.paymentId || payload?.client_reference_id;

  if (paymentId) {
    return Payment.findById(paymentId);
  }

  if (payload?.id) {
    return Payment.findOne({ providerCheckoutSessionId: payload.id });
  }

  if (payload?.payment_intent) {
    return Payment.findOne({ providerPaymentId: payload.payment_intent });
  }

  return null;
};

export const createCheckoutSession = async ({
  appointmentId,
  patientId,
  doctorId,
  amount,
  currency,
  actor
}) => {
  const validated = validateCheckoutPayload({ appointmentId, patientId, doctorId, amount, currency });

  const existingCaptured = await Payment.findOne({
    appointmentId: validated.appointmentId,
    status: "CAPTURED"
  }).lean();

  if (existingCaptured) {
    throw new AppError("Payment already captured for this appointment", 409, "PAYMENT_ALREADY_CAPTURED");
  }

  const payment = await Payment.create({
    appointmentId: validated.appointmentId,
    patientId: validated.patientId,
    doctorId: validated.doctorId,
    amount: validated.amount,
    currency: validated.currency,
    status: "PENDING",
    provider: "STRIPE",
    metadata: {
      patient: buildPatientSummary(actor, validated.patientId)
    }
  });

  const stripe = getStripeClient();

  try {
    const clientUrl = resolveClientUrl();
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      client_reference_id: payment._id.toString(),
      metadata: {
        paymentId: payment._id.toString(),
        appointmentId: validated.appointmentId,
        patientId: validated.patientId,
        doctorId: validated.doctorId
      },
      payment_intent_data: {
        metadata: {
          paymentId: payment._id.toString(),
          appointmentId: validated.appointmentId,
          patientId: validated.patientId,
          doctorId: validated.doctorId
        }
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: validated.currency.toLowerCase(),
            unit_amount: Math.round(validated.amount * 100),
            product_data: {
              name: `Appointment ${validated.appointmentId}`,
              description: "Smart Healthcare consultation payment"
            }
          }
        }
      ],
      success_url: `${clientUrl}/patient/booking-confirmation?appointmentId=${encodeURIComponent(
        validated.appointmentId
      )}&paymentId=${payment._id.toString()}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/patient/checkout?appointmentId=${encodeURIComponent(
        validated.appointmentId
      )}&doctorId=${encodeURIComponent(validated.doctorId)}`
    });

    payment.providerCheckoutSessionId = checkoutSession.id;
    payment.providerPaymentId =
      typeof checkoutSession.payment_intent === "string" ? checkoutSession.payment_intent : null;
    payment.status = "REQUIRES_ACTION";
    payment.metadata = {
      ...(payment.metadata || {}),
      checkoutUrl: checkoutSession.url,
      checkoutCreatedAt: new Date().toISOString()
    };
    await payment.save();

    await publishEvent("payment.checkout.created", {
      paymentId: payment._id.toString(),
      appointmentId: validated.appointmentId,
      patientId: validated.patientId,
      doctorId: validated.doctorId,
      amount: validated.amount,
      currency: validated.currency,
      provider: "STRIPE",
      checkoutSessionId: checkoutSession.id
    });

    const output = payment.toObject();
    output.checkoutUrl = checkoutSession.url;
    output.checkoutSessionId = checkoutSession.id;
    return output;
  } catch (error) {
    payment.status = "FAILED";
    payment.metadata = {
      ...(payment.metadata || {}),
      failureReason: error?.message || "Unable to create Stripe checkout session"
    };
    await payment.save();

    throw new AppError("Unable to create Stripe checkout session", 502, "STRIPE_CHECKOUT_FAILED");
  }
};

export const capturePayment = async ({ paymentId, actor }) => {
  const payment = await Payment.findById(paymentId);

  if (!payment) {
    throw new AppError("Payment not found", 404, "PAYMENT_NOT_FOUND");
  }

  if (payment.status === "CAPTURED") {
    return payment;
  }

  payment.status = "CAPTURED";
  payment.metadata = {
    ...(payment.metadata || {}),
    capturedBy: actor.userId || actor.id || actor.sub || "SYSTEM",
    capturedAt: new Date().toISOString(),
    captureSource: "MANUAL"
  };
  await payment.save();

  await publishCapturedEvents(payment);

  return payment;
};

export const failPayment = async ({ paymentId, reason }) => {
  const payment = await Payment.findById(paymentId);

  if (!payment) {
    throw new AppError("Payment not found", 404, "PAYMENT_NOT_FOUND");
  }

  if (payment.status === "CAPTURED") {
    throw new AppError("Captured payment cannot be marked as failed", 409, "INVALID_PAYMENT_TRANSITION");
  }

  payment.status = "FAILED";
  payment.metadata = {
    ...(payment.metadata || {}),
    failureReason: reason,
    failedAt: new Date().toISOString(),
    failureSource: "MANUAL"
  };
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

export const processStripeWebhook = async ({ signature, rawBody }) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new AppError("STRIPE_WEBHOOK_SECRET is not configured", 500, "STRIPE_WEBHOOK_NOT_CONFIGURED");
  }

  if (!signature) {
    throw new AppError("Stripe signature is missing", 400, "STRIPE_SIGNATURE_MISSING");
  }

  if (!rawBody || !(rawBody instanceof Buffer)) {
    throw new AppError("Invalid webhook payload", 400, "INVALID_WEBHOOK_PAYLOAD");
  }

  const stripe = getStripeClient();

  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    throw new AppError("Stripe webhook signature verification failed", 400, "INVALID_WEBHOOK_SIGNATURE");
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const payment = await findPaymentForStripeEvent(session);
      await capturePaymentFromWebhook({
        payment,
        eventId: event.id,
        providerPaymentId:
          typeof session.payment_intent === "string" ? session.payment_intent : undefined
      });
      break;
    }

    case "checkout.session.expired":
    case "checkout.session.async_payment_failed": {
      const session = event.data.object;
      const payment = await findPaymentForStripeEvent(session);
      await failPaymentFromWebhook({
        payment,
        eventId: event.id,
        reason: "Checkout session expired or payment failed",
        providerPaymentId:
          typeof session.payment_intent === "string" ? session.payment_intent : undefined
      });
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      const payment = await findPaymentForStripeEvent(paymentIntent);
      await failPaymentFromWebhook({
        payment,
        eventId: event.id,
        reason: paymentIntent.last_payment_error?.message || "Payment intent failed",
        providerPaymentId: paymentIntent.id
      });
      break;
    }

    default:
      break;
  }

  return {
    received: true,
    type: event.type
  };
};
