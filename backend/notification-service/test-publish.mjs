import "dotenv/config";
import amqplib from "amqplib";

const event = process.argv[2] || "notification.appointment.booked";

const buildPayload = (routingKey) => {
  const commonPatient = {
    userId: "test001",
    fullName: "Kamal Perera",
    email: "irusha.sliit@gmail.com",
    phone: "94762606950"
  };

  const commonDoctor = {
    userId: "doc001",
    fullName: "Dr. Irush",
    email: "doctor@example.com",
    specialization: "Cardiology"
  };

  const payloads = {
    "notification.user.registered": {
      eventId: "test-user-registered",
      occurredAt: new Date().toISOString(),
      patient: commonPatient,
      recipient: commonPatient,
      registeredAt: new Date().toISOString(),
      accountStatus: "ACTIVE",
      isEmailVerified: true
    },
    "notification.doctor.approved": {
      eventId: "test-doctor-approved",
      occurredAt: new Date().toISOString(),
      patient: {
        ...commonPatient,
        userId: "doc001",
        fullName: "Dr. Irush",
        email: "doctor@example.com",
        role: "DOCTOR"
      },
      recipient: {
        userId: "doc001",
        fullName: "Dr. Irush",
        email: "doctor@example.com",
        phone: "94762606951",
        role: "DOCTOR"
      },
      doctor: {
        userId: "doc001",
        fullName: "Dr. Irush",
        email: "doctor@example.com",
        phone: "94762606951",
        specialization: "Cardiology"
      },
      accountStatus: "ACTIVE",
      doctorVerificationStatus: "APPROVED"
    },
    "notification.doctor.rejected": {
      eventId: "test-doctor-rejected",
      occurredAt: new Date().toISOString(),
      patient: {
        ...commonPatient,
        userId: "doc002",
        fullName: "Dr. Nimal",
        email: "doctor2@example.com",
        role: "DOCTOR"
      },
      recipient: {
        userId: "doc002",
        fullName: "Dr. Nimal",
        email: "doctor2@example.com",
        phone: "94762606952",
        role: "DOCTOR"
      },
      doctor: {
        userId: "doc002",
        fullName: "Dr. Nimal",
        email: "doctor2@example.com",
        phone: "94762606952",
        specialization: "Dermatology"
      },
      accountStatus: "PENDING",
      doctorVerificationStatus: "CHANGES_REQUESTED",
      reason: "Supporting documents need to be updated"
    },
    "notification.account.suspended": {
      eventId: "test-account-suspended",
      occurredAt: new Date().toISOString(),
      patient: commonPatient,
      recipient: commonPatient,
      accountStatus: "SUSPENDED",
      reason: "Administrative review"
    },
    "notification.account.reactivated": {
      eventId: "test-account-reactivated",
      occurredAt: new Date().toISOString(),
      patient: commonPatient,
      recipient: commonPatient,
      accountStatus: "ACTIVE",
      reason: null
    },
    "notification.appointment.booked": {
      patient: commonPatient,
      doctor: commonDoctor,
      appointmentId: "APT001",
      appointmentDate: "2026-04-20T10:00:00Z",
      mode: "TELEMEDICINE"
    }
  };

  return payloads[routingKey];
};

const publishTestEvent = async () => {
  const rabbitUrl = process.env.RABBITMQ_URL || "amqp://localhost:5672";
  const exchange = process.env.RABBITMQ_EXCHANGE || "smart_health.events";

  const conn = await amqplib.connect(rabbitUrl);
  const channel = await conn.createChannel();

  await channel.assertExchange(exchange, "topic", { durable: true });

  const payload = buildPayload(event);

  if (!payload) {
    throw new Error(`Unsupported test event: ${event}`);
  }

  channel.publish(exchange, event, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
    contentType: "application/json"
  });

  console.log(`Test event published: ${event}`);

  await channel.close();
  await conn.close();
};

publishTestEvent().catch((err) => {
  console.error("Failed to publish test event:", err.message);
  process.exit(1);
});
