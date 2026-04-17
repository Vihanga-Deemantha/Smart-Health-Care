import amqplib from "amqplib";
import jwt from "jsonwebtoken";
import Doctor from "../models/doctor.model.js";
import AppError from "../utils/AppError.js";

const defaultRabbitUrl =
  process.env.NODE_ENV === "production"
    ? "amqp://rabbitmq:5672"
    : "amqp://localhost:5672";
const rabbitmqUrl = process.env.RABBITMQ_URL || defaultRabbitUrl;
const rabbitmqExchange = process.env.RABBITMQ_EXCHANGE || "smart_health.events";
let rabbitChannel = null;
let rabbitConnecting = null;

const requestUpstream = async ({ url, method, authorization, body }) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const headers = {};
    if (authorization) {
      headers.authorization = authorization;
    }
    if (body) {
      headers["content-type"] = "application/json";
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });

    const responseText = await response.text();
    let payload = null;

    if (responseText) {
      try {
        payload = JSON.parse(responseText);
      } catch {
        payload = { message: responseText };
      }
    }

    if (!response.ok) {
      throw new AppError(
        payload?.message || "Upstream request failed",
        response.status,
        payload?.code || "UPSTREAM_ERROR",
        payload?.details || null
      );
    }

    return payload;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new AppError("Appointment service request timed out", 504, "APPOINTMENT_TIMEOUT");
    }

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Appointment service is unavailable", 503, "APPOINTMENT_UNAVAILABLE");
  } finally {
    clearTimeout(timeout);
  }
};

const getAppointmentServiceBaseUrl = () => {
  const baseUrl = process.env.APPOINTMENT_SERVICE_URL;

  if (!baseUrl) {
    throw new AppError("APPOINTMENT_SERVICE_URL is not configured", 500, "APPOINTMENT_SERVICE_NOT_CONFIGURED");
  }

  return baseUrl;
};

const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, String(value));
    }
  });

  const value = query.toString();
  return value ? `?${value}` : "";
};

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
      console.warn("RabbitMQ unavailable for doctor-service notifications:", error.message);
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

  if (!baseUrl || !patientId) {
    return null;
  }

  if (!process.env.INTERNAL_SERVICE_SECRET) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(`${baseUrl}/internal/patients/${patientId}`, {
      headers: {
        "x-internal-service-secret": process.env.INTERNAL_SERVICE_SECRET
      },
      signal: controller.signal
    });

    const responseText = await response.text();
    let payload = null;

    if (responseText) {
      try {
        payload = JSON.parse(responseText);
      } catch {
        payload = { message: responseText };
      }
    }

    if (!response.ok) {
      return null;
    }

    return payload?.data || payload;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

const buildPatientPayload = (patientId, profile) => {
  if (!profile) {
    return { userId: patientId };
  }

  return {
    userId: profile.userId || profile._id || profile.id || patientId,
    fullName: profile.fullName || profile.name || "Patient",
    email: profile.email || null,
    phone: profile.phone || profile.contactNumber || null
  };
};

const hasPatientDetails = (patient) => {
  if (!patient || typeof patient !== "object") {
    return false;
  }

  return Boolean(
    patient.fullName ||
      patient.name ||
      patient.email ||
      patient.phone ||
      patient.contactNumber
  );
};

const buildPatientSummary = (patientId, profile) => ({
  userId: profile?.userId || profile?._id || profile?.id || patientId || null,
  fullName: profile?.fullName || profile?.name || "Patient",
  email: profile?.email || null,
  phone: profile?.phone || profile?.contactNumber || null
});

const resolvePatientId = (appointment) => {
  if (!appointment) {
    return null;
  }

  if (appointment.patientId) {
    return appointment.patientId;
  }

  if (typeof appointment.patient === "string") {
    return appointment.patient;
  }

  return appointment.patient?.userId || appointment.patient?._id || appointment.patient?.id || null;
};

const enrichAppointmentsWithPatients = async (appointments) => {
  if (!appointments?.length) {
    return appointments;
  }

  const needsEnrichment = appointments.some((appointment) => !hasPatientDetails(appointment?.patient));
  if (!needsEnrichment) {
    return appointments;
  }

  const patientIds = Array.from(
    new Set(
      appointments
        .map((appointment) => resolvePatientId(appointment))
        .filter(Boolean)
    )
  );

  if (!patientIds.length) {
    return appointments;
  }

  const patientProfiles = await Promise.all(patientIds.map((id) => fetchPatientProfile(id)));
  const patientMap = new Map();

  patientIds.forEach((id, index) => {
    patientMap.set(id, buildPatientSummary(id, patientProfiles[index]));
  });

  return appointments.map((appointment) => {
    if (hasPatientDetails(appointment?.patient)) {
      return appointment;
    }

    const patientId = resolvePatientId(appointment);
    const profile = patientMap.get(patientId);
    if (!profile) {
      return appointment;
    }

    return { ...appointment, patient: profile };
  });
};

const buildDoctorPayload = (actor) => {
  if (!actor) {
    return null;
  }

  return {
    userId: actor.userId || actor.id || null,
    fullName: actor.fullName || null,
    email: actor.email || null,
    phone: actor.phone || null
  };
};

const notifyAppointmentConfirmed = async ({ appointment, actor }) => {
  if (!appointment) {
    return;
  }

  const patientId = appointment.patientId || appointment.patient || null;
  const patientProfile = await fetchPatientProfile(patientId);

  await publishEvent("notification.appointment.confirmed", {
    appointmentId: appointment._id || appointment.id || appointment.appointmentId,
    appointmentDate: appointment.appointmentDate || null,
    startTime: appointment.startTime || null,
    mode: appointment.mode || null,
    patient: buildPatientPayload(patientId, patientProfile),
    doctor: buildDoctorPayload(actor)
  });
};

const notifyAppointmentRejected = async ({ appointment, actor, reason }) => {
  if (!appointment) {
    return;
  }

  const patientId = appointment.patientId || appointment.patient || null;
  const patientProfile = await fetchPatientProfile(patientId);
  const rejectionReason =
    reason || appointment?.cancellation?.reason || appointment?.reason || "Rejected by doctor";

  await publishEvent("notification.appointment.rejected", {
    appointmentId: appointment._id || appointment.id || appointment.appointmentId,
    appointmentDate: appointment.appointmentDate || null,
    startTime: appointment.startTime || null,
    mode: appointment.mode || null,
    reason: rejectionReason,
    patient: buildPatientPayload(patientId, patientProfile),
    doctor: buildDoctorPayload(actor)
  });
};

const resolveDoctorToken = async (actor) => {
  if (!actor?.userId) {
    return null;
  }

  const doctor = await Doctor.findOne({ userId: actor.userId }).lean();

  if (!doctor) {
    throw new AppError("Doctor profile not found", 404, "DOCTOR_NOT_FOUND");
  }

  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    throw new AppError("JWT secret is not configured", 500, "JWT_SECRET_MISSING");
  }

  const token = jwt.sign(
    {
      userId: doctor._id,
      role: "DOCTOR",
      email: actor.email,
      fullName: actor.fullName,
      phone: actor.phone
    },
    secret,
    { expiresIn: "5m" }
  );

  return `Bearer ${token}`;
};

const resolveAppointmentAuthorization = async ({ authorization, actor }) => {
  if (!actor || actor.role !== "DOCTOR") {
    return authorization;
  }

  const doctorToken = await resolveDoctorToken(actor);
  return doctorToken || authorization;
};

export const listDoctorAppointments = async ({ authorization, status, from, to, page, limit, actor }) => {
  const baseUrl = getAppointmentServiceBaseUrl();
  const queryString = buildQueryString({ status, from, to, page, limit });
  const resolvedAuthorization = await resolveAppointmentAuthorization({ authorization, actor });

  const response = await requestUpstream({
    url: `${baseUrl}/api/appointments${queryString}`,
    method: "GET",
    authorization: resolvedAuthorization
  });

  const payload = response?.data || response;

  if (Array.isArray(payload)) {
    return enrichAppointmentsWithPatients(payload);
  }

  if (Array.isArray(payload?.items)) {
    payload.items = await enrichAppointmentsWithPatients(payload.items);
  }

  return response;
};

export const getDoctorAppointmentById = async ({ appointmentId, authorization, actor }) => {
  const baseUrl = getAppointmentServiceBaseUrl();
  const resolvedAuthorization = await resolveAppointmentAuthorization({ authorization, actor });

  return requestUpstream({
    url: `${baseUrl}/api/appointments/${appointmentId}`,
    method: "GET",
    authorization: resolvedAuthorization
  });
};

export const respondToAppointment = async ({ appointmentId, action, reason, authorization, actor }) => {
  const baseUrl = getAppointmentServiceBaseUrl();
  const resolvedAuthorization = await resolveAppointmentAuthorization({ authorization, actor });

  const normalizedAction = String(action || "").toUpperCase();

  if (normalizedAction === "ACCEPT" || normalizedAction === "REJECT") {
    const response = await requestUpstream({
      url: `${baseUrl}/api/appointments/${appointmentId}/respond`,
      method: "PATCH",
      authorization: resolvedAuthorization,
      body: {
        action: normalizedAction,
        reason
      }
    });

    if (normalizedAction === "ACCEPT") {
      const appointment = response?.data?.appointment || response?.appointment || response?.data || response;
      try {
        await notifyAppointmentConfirmed({ appointment, actor });
      } catch (error) {
        console.warn("Failed to notify appointment confirmation:", error.message);
      }
    }

    if (normalizedAction === "REJECT") {
      const appointment = response?.data?.appointment || response?.appointment || response?.data || response;
      try {
        await notifyAppointmentRejected({ appointment, actor, reason });
      } catch (error) {
        console.warn("Failed to notify appointment rejection:", error.message);
      }
    }

    return response;
  }

  throw new AppError("Invalid appointment action", 400, "INVALID_ACTION");
};

export const cancelDoctorAppointment = async ({ appointmentId, authorization, reason, overridePolicy, actor }) => {
  const baseUrl = getAppointmentServiceBaseUrl();
  const resolvedAuthorization = await resolveAppointmentAuthorization({ authorization, actor });

  return requestUpstream({
    url: `${baseUrl}/api/appointments/${appointmentId}/cancel`,
    method: "PATCH",
    authorization: resolvedAuthorization,
    body: {
      reason,
      overridePolicy: Boolean(overridePolicy)
    }
  });
};

export const confirmDoctorAttendance = async ({ appointmentId, authorization, actor }) => {
  const baseUrl = getAppointmentServiceBaseUrl();
  const resolvedAuthorization = await resolveAppointmentAuthorization({ authorization, actor });

  return requestUpstream({
    url: `${baseUrl}/api/appointments/${appointmentId}/confirm-attendance`,
    method: "PATCH",
    authorization: resolvedAuthorization
  });
};

export const completeDoctorAppointment = async ({ appointmentId, authorization, actor }) => {
  const baseUrl = getAppointmentServiceBaseUrl();
  const resolvedAuthorization = await resolveAppointmentAuthorization({ authorization, actor });

  return requestUpstream({
    url: `${baseUrl}/api/appointments/${appointmentId}/complete`,
    method: "PATCH",
    authorization: resolvedAuthorization
  });
};

export const markDoctorNoShow = async ({ appointmentId, authorization, target = "PATIENT", actor }) => {
  const baseUrl = getAppointmentServiceBaseUrl();
  const resolvedAuthorization = await resolveAppointmentAuthorization({ authorization, actor });

  return requestUpstream({
    url: `${baseUrl}/api/appointments/${appointmentId}/no-show`,
    method: "PATCH",
    authorization: resolvedAuthorization,
    body: { target }
  });
};

export const getTelemedicineSession = async ({ appointmentId, authorization, actor }) => {
  const baseUrl = getAppointmentServiceBaseUrl();
  const resolvedAuthorization = await resolveAppointmentAuthorization({ authorization, actor });

  const payload = await requestUpstream({
    url: `${baseUrl}/api/appointments/${appointmentId}/telemedicine`,
    method: "GET",
    authorization: resolvedAuthorization
  });

  const sessionPayload = payload?.data?.session || payload?.session || payload?.data || payload;

  if (!sessionPayload) {
    throw new AppError("Telemedicine session not found", 404, "TELEMEDICINE_SESSION_NOT_FOUND");
  }

  return {
    appointmentId: sessionPayload.appointmentId || appointmentId,
    meetingLink: sessionPayload.meetingLink || sessionPayload.roomUrl || null,
    provider: sessionPayload.provider || null,
    calendarEventId: sessionPayload.calendarEventId || null,
    startTime: sessionPayload.startTime,
    endTime: sessionPayload.endTime,
    roomUrl: sessionPayload.roomUrl || sessionPayload.meetingLink || null
  };
};

export const getDoctorAvailability = async ({ doctorId, date, mode }) => {
  const baseUrl = getAppointmentServiceBaseUrl();
  const queryString = buildQueryString({ date, mode });

  return requestUpstream({
    url: `${baseUrl}/api/doctors/${doctorId}/availability${queryString}`,
    method: "GET"
  });
};
