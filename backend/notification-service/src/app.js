import express from "express";
import env from "./config/env.js";

const createApp = () => {
  const app = express();

  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", service: env.serviceName });
  });

  return app;
};

export default createApp;
