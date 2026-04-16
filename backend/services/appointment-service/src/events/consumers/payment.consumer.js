import Appointment from "../../models/Appointment.js";
import { getRabbitChannel } from "../../config/rabbitmq.js";
import { APPOINTMENT_STATUS } from "../../utils/constants.js";
import logger from "../../utils/logger.js";
import { createAuditLog } from "../../services/audit.service.js";

const exchange = process.env.RABBITMQ_EXCHANGE || "smart_health.events";
const queueName = process.env.APPOINTMENT_PAYMENT_EVENTS_QUEUE || "appointment.payment.events";
const routingKeys = ["payment.captured", "payment.failed"];

const parseMessage = (message) => {
  try {
    return JSON.parse(message.content.toString("utf8"));
  } catch {
    return null;
  }
};

const handlePaymentCaptured = async (payload) => {
  const appointment = await Appointment.findById(payload.appointmentId);

  if (!appointment) {
    logger.warn("Appointment not found for payment.captured event", {
      appointmentId: payload.appointmentId,
      paymentId: payload.paymentId
    });
    return;
  }

  if (
    [APPOINTMENT_STATUS.CANCELLED, APPOINTMENT_STATUS.NO_SHOW, APPOINTMENT_STATUS.COMPLETED].includes(
      appointment.status
    )
  ) {
    logger.info("Skipping payment capture transition due to terminal appointment status", {
      appointmentId: appointment._id.toString(),
      status: appointment.status
    });
    return;
  }

  const previousStatus = appointment.status;

  appointment.metadata = {
    ...(appointment.metadata || {}),
    payment: {
      paymentId: payload.paymentId,
      status: "CAPTURED",
      amount: payload.amount,
      currency: payload.currency,
      capturedAt: new Date().toISOString()
    }
  };

  if (appointment.status !== APPOINTMENT_STATUS.CONFIRMED) {
    appointment.status = APPOINTMENT_STATUS.CONFIRMED;
    appointment.statusTimestamps.confirmedAt = new Date();
  }

  await appointment.save();

  await createAuditLog({
    appointmentId: appointment._id,
    entityType: "APPOINTMENT",
    entityId: appointment._id.toString(),
    action: "PAYMENT_CAPTURED",
    actorId: "SYSTEM",
    actorRole: "SYSTEM",
    oldValue: { status: previousStatus },
    newValue: { status: appointment.status },
    metadata: {
      paymentId: payload.paymentId,
      amount: payload.amount,
      currency: payload.currency
    }
  });
};

const handlePaymentFailed = async (payload) => {
  const appointment = await Appointment.findById(payload.appointmentId);

  if (!appointment) {
    logger.warn("Appointment not found for payment.failed event", {
      appointmentId: payload.appointmentId,
      paymentId: payload.paymentId
    });
    return;
  }

  appointment.metadata = {
    ...(appointment.metadata || {}),
    payment: {
      ...(appointment.metadata?.payment || {}),
      paymentId: payload.paymentId,
      status: "FAILED",
      reason: payload.reason || "Payment failed",
      failedAt: new Date().toISOString()
    }
  };

  await appointment.save();

  await createAuditLog({
    appointmentId: appointment._id,
    entityType: "APPOINTMENT",
    entityId: appointment._id.toString(),
    action: "PAYMENT_FAILED",
    actorId: "SYSTEM",
    actorRole: "SYSTEM",
    metadata: {
      paymentId: payload.paymentId,
      reason: payload.reason || "Payment failed"
    }
  });
};

const handlePaymentEvent = async (routingKey, payload) => {
  if (!payload?.appointmentId) {
    logger.warn("Payment event missing appointmentId", { routingKey, payload });
    return;
  }

  if (routingKey === "payment.captured") {
    await handlePaymentCaptured(payload);
    return;
  }

  if (routingKey === "payment.failed") {
    await handlePaymentFailed(payload);
  }
};

export const initPaymentEventConsumer = async () => {
  const channel = getRabbitChannel();

  if (!channel) {
    logger.warn("Skipping payment event consumer initialization because RabbitMQ channel is unavailable");
    return;
  }

  await channel.assertExchange(exchange, "topic", { durable: true });
  await channel.assertQueue(queueName, { durable: true });

  for (const key of routingKeys) {
    await channel.bindQueue(queueName, exchange, key);
  }

  await channel.consume(queueName, async (message) => {
    if (!message) {
      return;
    }

    const payload = parseMessage(message);
    const routingKey = message.fields.routingKey;

    if (!payload) {
      logger.error("Dropping payment event with invalid JSON payload", { routingKey });
      channel.ack(message);
      return;
    }

    try {
      await handlePaymentEvent(routingKey, payload);
      channel.ack(message);
    } catch (error) {
      logger.error("Failed to process payment event", {
        routingKey,
        error: error.message
      });
      channel.nack(message, false, false);
    }
  });

  logger.info("Payment event consumer initialized", { queueName, routingKeys });
};