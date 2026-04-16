import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import "./src/config/env.js";
import paymentRoutes from "./src/routes/payment.routes.js";
import errorMiddleware from "./src/middlewares/error.middleware.js";
import { handleStripeWebhook } from "./src/controllers/payment.controller.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true
  })
);
app.use(morgan("dev"));

// Webhook signature verification requires the exact raw request body.
app.post("/api/payments/webhook/stripe", express.raw({ type: "application/json" }), handleStripeWebhook);

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ success: true, message: "Payment service running" });
});

app.use("/api/payments", paymentRoutes);

app.use(errorMiddleware);

export default app;
