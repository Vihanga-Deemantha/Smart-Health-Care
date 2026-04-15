import "dotenv/config";
import amqplib from "amqplib";

const publishTestEvent = async () => {
  const rabbitUrl = process.env.RABBITMQ_URL || "amqp://localhost:5672";
  const exchange = process.env.RABBITMQ_EXCHANGE || "smart_health.events";

  const conn = await amqplib.connect(rabbitUrl);
  const channel = await conn.createChannel();

  await channel.assertExchange(exchange, "topic", { durable: true });

  const payload = {
    patient: {
      userId: "test001",
      fullName: "Kamal Perera",
      email: "irusha.sliit@gmail.com",
      phone: "94762606950"
    },
    doctor: {
      userId: "doc001",
      fullName: "Dr. Irush",
      email: "doctor@example.com",
      specialization: "Cardiology"
    },
    appointmentId: "APT001",
    appointmentDate: "2026-04-20T10:00:00Z",
    mode: "TELEMEDICINE"
  };

  channel.publish(exchange, "notification.appointment.booked", Buffer.from(JSON.stringify(payload)), {
    persistent: true,
    contentType: "application/json"
  });

  console.log("Test event published: notification.appointment.booked");

  await channel.close();
  await conn.close();
};

publishTestEvent().catch((err) => {
  console.error("Failed to publish test event:", err.message);
  process.exit(1);
});
