import { getRabbitChannel } from "../../config/rabbitmq.js";
import logger from "../../utils/logger.js";

export const publishEvent = async (routingKey, payload) => {
  const channel = getRabbitChannel();
  const exchange = process.env.RABBITMQ_EXCHANGE || "smart_health.events";

  if (!channel) {
    logger.warn("Event not published because RabbitMQ channel is unavailable", { routingKey });
    return;
  }

  channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
    contentType: "application/json"
  });
};
