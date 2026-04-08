import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import "./src/config/env.js";

import adminRoutes from "./src/routes/admin.routes.js";
import dashboardRoutes from "./src/routes/dashboard.routes.js";
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
  res.json({ success: true, message: "Admin service running" });
});

app.use("/api/admin", adminRoutes);
app.use("/api/admin/dashboard", dashboardRoutes);

app.use(errorMiddleware);

export default app;

