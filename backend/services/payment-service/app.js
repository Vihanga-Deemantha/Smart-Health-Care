import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import "./src/config/env.js";
import paymentRoutes from "./src/routes/payment.routes.js";
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
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ success: true, message: "Payment service running" });
});

app.use("/api/payments", paymentRoutes);

app.use(errorMiddleware);

export default app;
