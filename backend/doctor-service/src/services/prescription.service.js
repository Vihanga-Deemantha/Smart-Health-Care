import amqplib from "amqplib";
import { randomUUID } from "node:crypto";
import Prescription from "../models/Prescription.js";
import AppError from "../utils/AppError.js";

const defaultRabbitUrl =
  process.env.NODE_ENV === "production"
    ? "amqp://rabbitmq:5672"
    : "amqp://localhost:5672";
const rabbitmqUrl = process.env.RABBITMQ_URL || defaultRabbitUrl;
const rabbitmqExchange = process.env.RABBITMQ_EXCHANGE || "smart_health.events";
let rabbitChannel = null;
let rabbitConnecting = null;

const getRabbitChannel = async () => {
  if (rabbitChannel) {
    return rabbitChannel;
  }

  if (rabbitConnecting) {
    return rabbitConnecting;
  }

  rabbitConnecting = (async () => {
    try {
      const connection = await amqplib.connect(rabbitmqUrl);

      connection.on("close", () => {
        rabbitChannel = null;
      });

      connection.on("error", (err) => {
        console.error("RabbitMQ connection error:", err.message);
      });

      const channel = await connection.createChannel();
      await channel.assertExchange(rabbitmqExchange, "topic", { durable: true });
      rabbitChannel = channel;
      return channel;
    } catch (error) {
      console.warn("RabbitMQ unavailable for prescription notifications:", error.message);
      return null;
    }
  })();

  try {
    return await rabbitConnecting;
  } finally {
    rabbitConnecting = null;
  }
};

const publishEvent = async (routingKey, payload) => {
  const channel = await getRabbitChannel();
  if (!channel) {
    return;
  }

  channel.publish(rabbitmqExchange, routingKey, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
    contentType: "application/json"
  });
};

const fetchPatientProfile = async (patientId) => {
  const baseUrl = process.env.PATIENT_SERVICE_URL;
  const secret = process.env.INTERNAL_SERVICE_SECRET;

  if (!baseUrl || !secret || !patientId) {
    return null;
  }

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/internal/patients/${patientId}`,
      {
        headers: {
          "x-internal-service-secret": secret
        }
      }
    );

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    return payload?.data || null;
  } catch {
    return null;
  }
};

const buildPatientPayload = (patientId, profile) => ({
  userId: profile?.userId || profile?._id || patientId,
  fullName: profile?.fullName || "Patient",
  email: profile?.email || null,
  phone: profile?.contactNumber || profile?.phone || null
});

const buildDoctorPayload = (doctor) => ({
  userId: doctor?.userId || doctor?.id || null,
  fullName: doctor?.fullName || doctor?.name || "Doctor",
  email: doctor?.email || null,
  phone: doctor?.phone || doctor?.contactNumber || null
});

export const createPrescription = async ({
  doctorId,
  patientId,
  appointmentId,
  diagnosis,
  instructions,
  medicines,
  doctor
}) => {
  if (!doctorId) {
    throw new AppError("doctorId is required", 400, "VALIDATION_ERROR");
  }

  if (!diagnosis) {
    throw new AppError("diagnosis is required", 400, "VALIDATION_ERROR");
  }

  if (!instructions) {
    throw new AppError("instructions are required", 400, "VALIDATION_ERROR");
  }

  const patientProfile = await fetchPatientProfile(patientId);
  const doctorPayload = buildDoctorPayload(doctor || {});
  const patientPayload = buildPatientPayload(patientId, patientProfile);

  const prescription = await Prescription.create({
    doctorId,
    doctorName: doctorPayload.fullName,
    patientId,
    patientName: patientPayload.fullName,
    appointmentId,
    diagnosis,
    instructions,
    medicines,
    issuedAt: new Date()
  });

  try {
    await publishEvent("notification.prescription.issued", {
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
      appointmentId,
      prescriptionId: prescription._id.toString(),
      medicines,
      diagnosis,
      instructions,
      patient: patientPayload,
      doctor: doctorPayload
    });
  } catch (error) {
    console.warn("Failed to publish prescription notification:", error.message);
  }

  return prescription;
};

export const listPrescriptionsForPatient = async ({ patientId, limit = 20 }) => {
  const normalizedLimit = Number(limit) || 20;

  return Prescription.find({ patientId })
    .sort({ issuedAt: -1 })
    .limit(normalizedLimit)
    .lean();
};

export const listPrescriptionsForDoctor = async ({ doctorId, limit = 20 }) => {
  const normalizedLimit = Number(limit) || 20;

  return Prescription.find({ doctorId })
    .sort({ issuedAt: -1 })
    .limit(normalizedLimit)
    .lean();
};

export const getPrescriptionByAppointment = async ({ appointmentId, doctorId }) => {
  if (!doctorId) {
    throw new AppError("doctorId is required", 400, "VALIDATION_ERROR");
  }

  const prescription = await Prescription.findOne({ appointmentId, doctorId }).lean();

  if (!prescription) {
    throw new AppError("Prescription not found", 404, "PRESCRIPTION_NOT_FOUND");
  }

  return prescription;
};

export const updatePrescriptionByAppointment = async ({
  appointmentId,
  doctorId,
  diagnosis,
  instructions,
  medicines
}) => {
  if (!doctorId) {
    throw new AppError("doctorId is required", 400, "VALIDATION_ERROR");
  }

  const prescription = await Prescription.findOne({ appointmentId, doctorId });

  if (!prescription) {
    throw new AppError("Prescription not found", 404, "PRESCRIPTION_NOT_FOUND");
  }

  prescription.diagnosis = diagnosis;
  prescription.instructions = instructions;
  prescription.medicines = medicines;
  await prescription.save();

  return prescription.toObject();
};
