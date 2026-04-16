import mongoose from "mongoose";
import env from "./config/env.js";
import createApp from "./app.js";
import { startUniversalConsumer } from "./consumers/universal.consumer.js";

const start = async () => {
  try {
    await mongoose.connect(env.mongodbUri);
    console.log("MongoDB connected to notification-db");

    await startUniversalConsumer();

    const app = createApp();
    app.listen(env.port, () => {
      console.log(`Notification service listening on ${env.port}`);
    });
  } catch (err) {
    console.error("Startup failed:", err.message);
    process.exit(1);
  }
};

start();
