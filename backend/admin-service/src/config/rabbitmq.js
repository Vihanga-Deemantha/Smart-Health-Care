import amqplib from "amqplib";

let connection;
let channel;
let connectPromise;

export const connectRabbitMQ = async () => {
  if (channel) {
    return channel;
  }

  if (connectPromise) {
    return connectPromise;
  }

  const rabbitUrl = process.env.RABBITMQ_URL;
  const exchange = process.env.RABBITMQ_EXCHANGE || "smart_health.events";

  if (!rabbitUrl) {
    console.warn("[rabbitmq] RABBITMQ_URL missing, skipping broker connection");
    return null;
  }

  connectPromise = (async () => {
    try {
      connection = await amqplib.connect(rabbitUrl);
      channel = await connection.createChannel();
      await channel.assertExchange(exchange, "topic", { durable: true });

      connection.on("close", () => {
        channel = null;
        connection = null;
        console.warn("[rabbitmq] Connection closed");
      });

      connection.on("error", (error) => {
        console.warn("[rabbitmq] Connection error:", error.message);
      });

      console.log(`[rabbitmq] Connected to exchange ${exchange}`);
      return channel;
    } catch (error) {
      channel = null;
      connection = null;
      console.warn("[rabbitmq] Broker connection skipped:", error.message);
      return null;
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
};

export const getRabbitChannel = () => channel;
