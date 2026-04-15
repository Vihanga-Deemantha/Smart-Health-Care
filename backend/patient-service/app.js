import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import "./src/config/env.js";

import patientRoutes from "./src/routes/patient.routes.js";
import internalRoutes from "./src/routes/internal.routes.js";
import errorMiddleware from "./src/middlewares/error.middleware.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Patient service running"
  });
});

app.use("/api/patients", patientRoutes);
app.use("/internal", internalRoutes);

app.use(errorMiddleware);

export default app;
