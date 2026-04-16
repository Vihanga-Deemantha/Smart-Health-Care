import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

router.get("/health", (req, res) => {
  const database = mongoose.connection.readyState === 1 ? "connected" : "disconnected";

  res.status(200).json({
    service: "telemedicine-service",
    status: "ok",
    timestamp: new Date().toISOString(),
    database
  });
});

export default router;
