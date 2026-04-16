import express from "express";
import cors from "cors";
import "./config/env.js";
import doctorRoutes from "./routes/doctor.routes.js";
import availabilityRoutes from "./routes/availability.routes.js";
import appointmentRoutes from "./routes/appointment.routes.js";
import prescriptionRoutes from "./routes/prescription.routes.js";
import internalRoutes from "./routes/internal.routes.js";
import errorMiddleware from "./middlewares/error.middleware.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: Boolean(process.env.CLIENT_URL)
  })
);
app.use(express.json({ limit: "2mb" }));

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Doctor service running"
  });
});

app.use("/api/doctors", doctorRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/internal", internalRoutes);

app.use(errorMiddleware);

export default app;
