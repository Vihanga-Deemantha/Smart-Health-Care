import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import "./src/config/env.js";

import protect from "./src/middlewares/auth.middleware.js";
import { globalRateLimiter } from "./src/middlewares/rateLimit.middleware.js";
import errorMiddleware from "./src/middlewares/error.middleware.js";
import { createServiceProxy } from "./src/services/proxy.service.js";

const app = express();

// In docker/k8s, requests arrive through proxies (nginx/load balancer).
app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(globalRateLimiter);

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API Gateway running"
  });
});

app.use("/api/auth", createServiceProxy(process.env.AUTH_SERVICE_URL));
app.use(
  "/api/admin",
  protect,
  createServiceProxy(process.env.ADMIN_SERVICE_URL)
);
app.use(
  "/api/patients",
  protect,
  createServiceProxy(process.env.PATIENT_SERVICE_URL)
);
app.use(
  "/api/ai",
  protect,
  createServiceProxy(process.env.AI_CHATBOT_SERVICE_URL)
);
app.use("/api/doctors", createServiceProxy(process.env.DOCTOR_SERVICE_URL));
app.use("/api/feedback/doctors", createServiceProxy(process.env.APPOINTMENT_SERVICE_URL));
app.use("/api/emergency-resources", createServiceProxy(process.env.APPOINTMENT_SERVICE_URL));
app.use("/api/appointments", protect, createServiceProxy(process.env.APPOINTMENT_SERVICE_URL));
app.use("/api/sessions", protect, createServiceProxy(process.env.TELEMEDICINE_SERVICE_URL));
app.use("/api/prescriptions", protect, createServiceProxy(process.env.DOCTOR_SERVICE_URL));
app.use("/api/feedback", protect, createServiceProxy(process.env.APPOINTMENT_SERVICE_URL));
app.use("/api/waitlist", protect, createServiceProxy(process.env.APPOINTMENT_SERVICE_URL));
app.use("/api/emergency-alerts", protect, createServiceProxy(process.env.APPOINTMENT_SERVICE_URL));
app.use("/api/notifications", protect, createServiceProxy(process.env.APPOINTMENT_SERVICE_URL));
app.use("/api/payments", protect, createServiceProxy(process.env.PAYMENT_SERVICE_URL));

app.use(errorMiddleware);

export default app;
