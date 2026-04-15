import "./src/config/env.js";
import mongoose from "mongoose";
import app from "./app.js";
import { connectRabbitMQ } from "./src/config/rabbitmq.js";

const PORT = process.env.PORT || 5002;

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Admin DB connected");
    await connectRabbitMQ();

    app.listen(PORT, () => {
      console.log(`Admin service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Admin service startup failed:", error.message);
    process.exit(1);
  }
};

startServer();

