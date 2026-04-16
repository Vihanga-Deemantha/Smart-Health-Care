import "./src/config/env.js";
import app from "./app.js";
import connectDB from "./src/config/db.js";
import { connectRabbitMQ } from "./src/config/rabbitmq.js";
import { initQueues } from "./src/config/redis.js";
import { initWorkers } from "./src/jobs/workers.js";
import logger from "./src/utils/logger.js";
import { initPaymentEventConsumer } from "./src/events/consumers/payment.consumer.js";

const PORT = Number(process.env.PORT) || 5027;

const startServer = async () => {
  try {
    await connectDB();
    await connectRabbitMQ();
    await initPaymentEventConsumer();
    await initQueues();
    initWorkers();

    app.listen(PORT, () => {
      logger.info(`Appointment service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Server startup failed", { error: error.message });
    process.exit(1);
  }
};

startServer();
