import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import "./src/config/env.js";
import { requestIdMiddleware } from "./src/middlewares/requestId.middleware.js";
import { globalRateLimiter } from "./src/middlewares/rateLimit.middleware.js";
import errorMiddleware from "./src/middlewares/error.middleware.js";
import docsRouter from "./src/routes/docs.routes.js";
import doctorRoutes from "./src/routes/doctor.routes.js";
import appointmentRoutes from "./src/routes/appointment.routes.js";
import feedbackRoutes from "./src/routes/feedback.routes.js";
import waitlistRoutes from "./src/routes/waitlist.routes.js";
import emergencyRoutes from "./src/routes/emergency.routes.js";
import emergencyResourceRoutes from "./src/routes/emergencyResource.routes.js";
import notificationRoutes from "./src/routes/notification.routes.js";
import adminRoutes from "./src/routes/admin.routes.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(requestIdMiddleware);
app.use(globalRateLimiter);

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Appointment service running"
  });
});

app.use("/api/docs", docsRouter);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/waitlist", waitlistRoutes);
app.use("/api/emergency-alerts", emergencyRoutes);
app.use("/api/emergency-resources", emergencyResourceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

app.use(errorMiddleware);

export default app;
