import dotenv from "dotenv";

dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { v4 as uuidv4 } from "uuid";
import sessionRoutes from "./routes/sessionRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import { connectDB } from "./config/db.js";
import { publishEvent, subscribeToEvent } from "./config/rabbitmq.js";
import Session from "./models/Session.js";
import logger from "./utils/logger.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});

app.use("/api", apiLimiter);
app.use(healthRoutes);
app.use(sessionRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, req, res, next) => {
  logger.error(err.message || "Server error");
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Server error"
  });
});

const buildChannelName = (appointmentId) => {
  const shortId = String(appointmentId || "").slice(-6) || "session";
  const suffix = uuidv4().replace(/-/g, "").slice(0, 8);
  return `appt_${shortId}_${suffix}`;
};

const buildJitsiUrl = (channelName) => {
  const baseUrl = (process.env.JITSI_BASE_URL || "https://meet.jit.si").replace(/\/$/, "");
  return `${baseUrl}/${channelName}`;
};

const rabbitRetryMs = Number(process.env.RABBITMQ_RETRY_MS || 5000);
let consumerActive = false;
let consumerStarting = false;
let retryTimer = null;

const createSessionFromEvent = async (payload) => {
  if (!payload?.appointmentId || !payload?.patientId || !payload?.doctorId) {
    logger.warn("Appointment event missing required fields");
    return;
  }

  const existing = await Session.findOne({ appointmentId: payload.appointmentId }).lean();
  if (existing) {
    return;
  }

  const channelName = buildChannelName(payload.appointmentId);
  const jitsiRoomUrl = buildJitsiUrl(channelName);
  const scheduledAt = payload.scheduledAt || payload.startTime || payload.appointmentDate || null;

  const session = await Session.create({
    appointmentId: payload.appointmentId,
    channelName,
    jitsiRoomUrl,
    provider: "jitsi",
    patientId: payload.patientId,
    doctorId: payload.doctorId,
    patientName: payload.patientName || null,
    doctorName: payload.doctorName || null,
    specialty: payload.specialty || null,
    scheduledAt,
    status: "scheduled",
    createdBy: "event:appointment.confirmed"
  });

  await publishEvent("notification.appointment.confirmed", {
    sessionId: session._id.toString(),
    appointmentId: session.appointmentId,
    patientId: session.patientId,
    doctorId: session.doctorId,
    channelName: session.channelName,
    scheduledAt: session.scheduledAt,
    jitsiRoomUrl: session.jitsiRoomUrl
  });
};

const scheduleRabbitRetry = (reason) => {
  if (retryTimer) {
    return;
  }

  logger.warn(`RabbitMQ unavailable (${reason}). Retrying in ${rabbitRetryMs}ms...`);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    startAppointmentConsumer().catch(() => {});
  }, rabbitRetryMs);
};

const startAppointmentConsumer = async () => {
  if (consumerActive || consumerStarting) {
    return;
  }

  consumerStarting = true;

  try {
    const channel = await subscribeToEvent(
      "appointment.confirmed",
      "telemedicine_appointment_confirmed",
      async (payload) => {
        await createSessionFromEvent(payload);
      }
    );

    if (!channel) {
      scheduleRabbitRetry("connection failed");
      return;
    }

    consumerActive = true;

    channel.on("close", () => {
      consumerActive = false;
      scheduleRabbitRetry("channel closed");
    });

    channel.on("error", (error) => {
      logger.error(`RabbitMQ channel error: ${error.message}`);
    });

    logger.info("Telemedicine RabbitMQ consumer active");
  } catch (error) {
    scheduleRabbitRetry(error.message || "connection failed");
  } finally {
    consumerStarting = false;
  }
};

const PORT = Number(process.env.PORT) || 5033;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      logger.info(`Telemedicine service running on port ${PORT}`);
    });

    startAppointmentConsumer().catch(() => {});
  } catch (error) {
    logger.error(error.message || "Telemedicine service startup failed");
    process.exit(1);
  }
};

startServer();
