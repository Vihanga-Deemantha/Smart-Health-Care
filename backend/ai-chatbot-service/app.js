import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import "./src/config/env.js";

import chatRoutes from "./src/routes/chat.routes.js";
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
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AI chatbot service running"
  });
});

app.use("/api/ai", chatRoutes);

app.use(errorMiddleware);

export default app;
