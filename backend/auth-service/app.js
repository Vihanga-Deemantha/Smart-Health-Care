import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import "./src/config/env.js";
import authRoutes from "./src/routes/auth.routes.js";
import internalAdminRoutes from "./src/routes/internalAdmin.routes.js";
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
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Auth service is running"
  });
});

app.use("/api/auth", authRoutes);
app.use("/internal/admin", internalAdminRoutes);

app.use(errorMiddleware);

export default app;
