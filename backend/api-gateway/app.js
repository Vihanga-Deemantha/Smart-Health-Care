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

app.use(errorMiddleware);

export default app;
