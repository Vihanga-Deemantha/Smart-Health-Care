import amqplib from "amqplib";
import logger from "../utils/logger.js";

let connection;
let channel;

export const connectRabbitMQ = async () => {
  if (channel) {
    return channel;
  }

  const rabbitUrl = process.env.RABBITMQ_URL;
  const exchange = process.env.RABBITMQ_EXCHANGE || "smart_health.events";

  if (!rabbitUrl) {
    logger.warn("RABBITMQ_URL missing, skipping broker connection");
    return null;
  }

  connection = await amqplib.connect(rabbitUrl);
  channel = await connection.createChannel();
  await channel.assertExchange(exchange, "topic", { durable: true });
  logger.info("RabbitMQ connected", { exchange });

  return channel;
};

export const getRabbitChannel = () => channel;
