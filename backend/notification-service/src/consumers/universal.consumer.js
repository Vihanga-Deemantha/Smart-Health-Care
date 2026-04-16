import env from "../config/env.js";
import { connectRabbitMQ } from "../config/rabbitmq.js";
import { processNotification } from "../services/notification.processor.js";

let consumerActive = false;
let starting = false;
let retryTimer = null;

const scheduleRetry = (reason) => {
  if (retryTimer) {
    return;
  }

  console.warn(
    `RabbitMQ unavailable (${reason}). Retrying in ${env.rabbitmqRetryMs}ms...`
  );

  retryTimer = setTimeout(() => {
    retryTimer = null;
    startUniversalConsumer().catch(() => {});
  }, env.rabbitmqRetryMs);
};

export const startUniversalConsumer = async () => {
  if (consumerActive || starting) {
    return;
  }

  starting = true;

  try {
    const channel = await connectRabbitMQ();

    if (!channel) {
      scheduleRetry("missing RABBITMQ_URL");
      return;
    }

    const q = await channel.assertQueue(env.rabbitmqQueue, { durable: true });
    await channel.bindQueue(q.queue, env.rabbitmqExchange, env.rabbitmqBindingKey);

    channel.consume(q.queue, async (msg) => {
      if (!msg) {
        return;
      }

      const event = msg.fields?.routingKey || "unknown";
      let payload = {};

      try {
        payload = JSON.parse(msg.content.toString() || "{}");
      } catch (err) {
        console.error("Failed to parse message payload:", err.message);
        channel.ack(msg);
        return;
      }

      console.log(`Event received: ${event}`);

      try {
        await processNotification(event, payload);
      } catch (err) {
        console.error(`Notification processing failed for ${event}:`, err.message);
      }

      channel.ack(msg);
    });

    consumerActive = true;

    channel.on("close", () => {
      consumerActive = false;
      scheduleRetry("channel closed");
    });

    channel.on("error", (err) => {
      console.error("RabbitMQ channel error:", err.message);
    });

    console.log(
      `Universal consumer active. exchange=${env.rabbitmqExchange}, bindingKey=${env.rabbitmqBindingKey}`
    );
  } catch (err) {
    scheduleRetry(err.message || "connection failed");
  } finally {
    starting = false;
  }
};
