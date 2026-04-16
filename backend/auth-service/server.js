import "./src/config/env.js";
import app from "./app.js";
import connectDB from "./src/config/db.js";
import { connectRabbitMQ } from "./src/config/rabbitmq.js";

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDB();
    await connectRabbitMQ();
    app.listen(PORT, () => {
      console.log(`Auth service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
