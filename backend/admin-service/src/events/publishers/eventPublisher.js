import { connectRabbitMQ, getRabbitChannel } from "../../config/rabbitmq.js";

export const publishEvent = async (routingKey, payload) => {
  let channel = getRabbitChannel();
  const exchange = process.env.RABBITMQ_EXCHANGE || "smart_health.events";

  if (!channel) {
    channel = await connectRabbitMQ();
  }

  if (!channel) {
    console.warn("[rabbitmq] Event not published because channel is unavailable:", routingKey);
    return false;
  }

  return channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
    contentType: "application/json"
  });
};
