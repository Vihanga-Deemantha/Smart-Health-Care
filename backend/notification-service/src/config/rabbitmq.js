import amqplib from "amqplib";
import env from "./env.js";

let connection = null;
let channel = null;
let connecting = null;

export const connectRabbitMQ = async () => {
  if (channel) {
    return channel;
  }

  if (!env.rabbitmqUrl) {
    return null;
  }

  if (connecting) {
    return connecting;
  }

  connecting = (async () => {
    const conn = await amqplib.connect(env.rabbitmqUrl);

    conn.on("close", () => {
      connection = null;
      channel = null;
    });

    conn.on("error", (err) => {
      console.error("RabbitMQ connection error:", err.message);
    });

    const ch = await conn.createChannel();
    await ch.assertExchange(env.rabbitmqExchange, "topic", { durable: true });

    connection = conn;
    channel = ch;

    return ch;
  })();

  try {
    return await connecting;
  } finally {
    connecting = null;
  }
};

export const getRabbitChannel = () => channel;
