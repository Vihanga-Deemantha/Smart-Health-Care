import amqplib from "amqplib";
import logger from "../utils/logger.js";

const exchangeName = process.env.RABBITMQ_EXCHANGE || "smart_health.events";
let connection = null;
let channel = null;
let connecting = null;

export const connectRabbitMQ = async () => {
  if (channel) {
    return channel;
  }

  if (connecting) {
    return connecting;
  }

  connecting = (async () => {
    const rabbitUrl = process.env.RABBITMQ_URL;

    if (!rabbitUrl) {
      logger.warn("RABBITMQ_URL is not configured");
      return null;
    }

    try {
      connection = await amqplib.connect(rabbitUrl);
      connection.on("close", () => {
        logger.warn("RabbitMQ connection closed");
        channel = null;
        connection = null;
      });
      connection.on("error", (error) => {
        logger.error(`RabbitMQ error: ${error.message}`);
      });

      channel = await connection.createChannel();
      await channel.assertExchange(exchangeName, "topic", { durable: true });
      logger.info("RabbitMQ connected");
      return channel;
    } catch (error) {
      channel = null;
      connection = null;
      logger.warn(`RabbitMQ unavailable: ${error.message}`);
      return null;
    }
  })();

  try {
    return await connecting;
  } finally {
    connecting = null;
  }
};

export const publishEvent = async (routingKey, payload) => {
  const rabbitChannel = await connectRabbitMQ();
  if (!rabbitChannel) {
    return;
  }

  rabbitChannel.publish(
    exchangeName,
    routingKey,
    Buffer.from(JSON.stringify(payload)),
    {
      persistent: true,
      contentType: "application/json"
    }
  );
};

export const subscribeToEvent = async (routingKey, queueName, handler) => {
  const rabbitChannel = await connectRabbitMQ();

  if (!rabbitChannel) {
    return null;
  }

  await rabbitChannel.assertQueue(queueName, { durable: true });
  await rabbitChannel.bindQueue(queueName, exchangeName, routingKey);

  await rabbitChannel.consume(queueName, async (message) => {
    if (!message) {
      return;
    }

    try {
      const content = message.content.toString();
      const payload = content ? JSON.parse(content) : {};
      await handler(payload);
      rabbitChannel.ack(message);
    } catch (error) {
      logger.error(`RabbitMQ handler failed: ${error.message}`);
      rabbitChannel.nack(message, false, false);
    }
  });

  return rabbitChannel;
};
