import amqplib from "amqplib";

let channel;

const getChannel = async () => {
  if (channel) {
    return channel;
  }

  if (!process.env.RABBITMQ_URL) {
    return null;
  }

  const connection = await amqplib.connect(process.env.RABBITMQ_URL);
  channel = await connection.createChannel();
  await channel.assertExchange(process.env.RABBITMQ_EXCHANGE || "smart_health.events", "topic", {
    durable: true
  });

  return channel;
};

export const publishEvent = async (routingKey, payload) => {
  const ch = await getChannel();

  if (!ch) {
    return;
  }

  ch.publish(
    process.env.RABBITMQ_EXCHANGE || "smart_health.events",
    routingKey,
    Buffer.from(JSON.stringify(payload)),
    { persistent: true }
  );
};
