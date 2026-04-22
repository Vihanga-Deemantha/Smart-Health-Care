import { v4 as uuidv4 } from "uuid";
import Session from "../models/Session.js";
import { publishEvent } from "../config/rabbitmq.js";
import logger from "../utils/logger.js";

const sendSuccess = (res, status, payload = {}) =>
  res.status(status).json({ success: true, ...payload });

const sendError = (res, status, message) =>
  res.status(status).json({ success: false, message });

const buildChannelName = (appointmentId) => {
  const shortId = String(appointmentId || "").slice(-6) || "session";
  const suffix = uuidv4().replace(/-/g, "").slice(0, 8);
  return `appt_${shortId}_${suffix}`;
};

const buildJitsiUrl = (channelName) => {
  const baseUrl = (process.env.JITSI_BASE_URL || "https://meet.jit.si").replace(/\/$/, "");
  return `${baseUrl}/${channelName}`;
};

const normalizeServiceUrl = (value) => {
  if (!value) {
    return null;
  }

  return String(value).replace(/\/$/, "");
};

const fetchInternalPayload = async (url) => {
  const secret = process.env.INTERNAL_SERVICE_SECRET;

  if (!url || !secret) {
    return null;
  }

  try {
    const response = await fetch(url, {
      headers: {
        "x-internal-service-secret": secret
      }
    });

    if (!response.ok) {
      logger.warn(`Internal service request failed (${response.status})`);
      return null;
    }

    const payload = await response.json();
    return payload?.data || null;
  } catch (error) {
    logger.warn(`Internal service request failed: ${error.message}`);
    return null;
  }
};

const fetchPatientProfile = async (patientId) => {
  const baseUrl = normalizeServiceUrl(process.env.PATIENT_SERVICE_URL);
  if (!baseUrl || !patientId) {
    return null;
  }

  return fetchInternalPayload(`${baseUrl}/internal/patients/${patientId}`);
};

const fetchDoctorProfile = async (doctorId) => {
  const baseUrl = normalizeServiceUrl(process.env.DOCTOR_SERVICE_URL);
  if (!baseUrl || !doctorId) {
    return null;
  }

  const payload = await fetchInternalPayload(
    `${baseUrl}/internal/doctors?userId=${encodeURIComponent(doctorId)}`
  );

  if (Array.isArray(payload)) {
    return payload[0] || null;
  }

  return payload || null;
};

const buildRecipient = (profile, fallback) => {
  const recipient = {
    userId: profile?.userId || profile?._id || fallback?.userId || null,
    fullName: profile?.fullName || profile?.name || fallback?.fullName || null,
    email: profile?.email || fallback?.email || null,
    phone:
      profile?.phone ||
      profile?.contactNumber ||
      fallback?.phone ||
      fallback?.contactNumber ||
      null
  };

  return recipient;
};

const canNotifyRecipient = (recipient) =>
  Boolean(recipient?.email || recipient?.phone);

const isParticipant = (session, user) => {
  if (!session || !user) {
    return false;
  }

  const userId = String(user.userId || "");
  return String(session.patientId) === userId || String(session.doctorId) === userId;
};

const isAdmin = (user) => user?.role === "ADMIN";

export const createSession = async (req, res) => {
  try {
    const {
      appointmentId,
      patientId,
      doctorId,
      patientName,
      doctorName,
      specialty,
      scheduledAt
    } = req.body || {};

    if (!appointmentId || !patientId || !doctorId) {
      return sendError(res, 400, "appointmentId, patientId, and doctorId are required");
    }

    const existing = await Session.findOne({ appointmentId });
    if (existing) {
      return sendError(res, 409, "Session already exists for this appointment");
    }

    const channelName = buildChannelName(appointmentId);
    const jitsiRoomUrl = buildJitsiUrl(channelName);

    const session = await Session.create({
      appointmentId,
      channelName,
      jitsiRoomUrl,
      provider: "jitsi",
      patientId,
      doctorId,
      patientName,
      doctorName,
      specialty,
      scheduledAt,
      status: "scheduled",
      createdBy: req.user?.userId || "manual"
    });

    await publishEvent("notification.appointment.confirmed", {
      sessionId: session._id.toString(),
      appointmentId: session.appointmentId,
      patientId: session.patientId,
      doctorId: session.doctorId,
      channelName: session.channelName,
      scheduledAt: session.scheduledAt,
      jitsiRoomUrl: session.jitsiRoomUrl
    });

    return sendSuccess(res, 201, { session });
  } catch (error) {
    return sendError(res, 500, error.message || "Failed to create session");
  }
};

export const joinSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);

    if (!session) {
      return sendError(res, 404, "Session not found");
    }

    if (!isParticipant(session, req.user)) {
      return sendError(res, 403, "Forbidden");
    }

    if (["completed", "cancelled"].includes(session.status)) {
      return sendError(res, 400, "Session is not active");
    }

    const isJoinable = Boolean(session.isJoinable);
    const joinWarning = isJoinable
      ? null
      : session.scheduledAt
        ? "Session is outside the scheduled join window"
        : "Session schedule is not set";

    const role = String(req.user?.role || "").toLowerCase();
    if (role === "patient") {
      session.patientJoined = true;
    }
    if (role === "doctor") {
      session.doctorJoined = true;
    }

    if (session.status === "scheduled") {
      session.status = "waiting";
      session.waitingStartedAt = new Date();
      if (!session.sessionStartedAt) {
        session.sessionStartedAt = new Date();
      }
    }

    let becameActive = false;
    if (session.patientJoined && session.doctorJoined && session.status === "waiting") {
      session.status = "active";
      session.sessionStartedAt = new Date();
      becameActive = true;
    }

    await session.save();

    if (becameActive) {
      const [patientProfile, doctorProfile] = await Promise.all([
        fetchPatientProfile(session.patientId),
        fetchDoctorProfile(session.doctorId)
      ]);

      const patientRecipient = buildRecipient(patientProfile, {
        userId: session.patientId,
        fullName: session.patientName || "Patient"
      });

      const doctorRecipient = buildRecipient(doctorProfile, {
        userId: session.doctorId,
        fullName: session.doctorName || "Doctor"
      });

      const notificationPayload = {
        sessionId: session._id.toString(),
        appointmentId: session.appointmentId,
        patientId: session.patientId,
        doctorId: session.doctorId,
        patientName: patientRecipient.fullName || session.patientName,
        doctorName: doctorRecipient.fullName || session.doctorName,
        jitsiRoomUrl: session.jitsiRoomUrl,
        sessionStartedAt: session.sessionStartedAt,
        scheduledAt: session.scheduledAt,
        patient: patientRecipient,
        doctor: doctorRecipient
      };

      if (canNotifyRecipient(patientRecipient)) {
        await publishEvent("notification.telemedicine.session.started", {
          ...notificationPayload,
          recipientRole: "patient"
        });
      } else {
        logger.warn("Skipping patient session-start notification; missing contact info.");
      }

      if (canNotifyRecipient(doctorRecipient)) {
        await publishEvent("notification.telemedicine.session.started.doctor", {
          ...notificationPayload,
          recipientRole: "doctor"
        });
      } else {
        logger.warn("Skipping doctor session-start notification; missing contact info.");
      }
    }

    return sendSuccess(res, 200, {
      sessionId: session._id.toString(),
      channelName: session.channelName,
      jitsiRoomUrl: session.jitsiRoomUrl,
      provider: "jitsi",
      status: session.status,
      patientJoined: session.patientJoined,
      doctorJoined: session.doctorJoined,
      sessionStartedAt: session.sessionStartedAt,
      joinable: isJoinable,
      warning: joinWarning,
      scheduledAt: session.scheduledAt,
      patientName: session.patientName,
      doctorName: session.doctorName,
      specialty: session.specialty
    });
  } catch (error) {
    return sendError(res, 500, error.message || "Failed to join session");
  }
};

export const endSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);

    if (!session) {
      return sendError(res, 404, "Session not found");
    }

    if (!isParticipant(session, req.user)) {
      return sendError(res, 403, "Forbidden");
    }

    if (session.status === "completed") {
      return sendError(res, 400, "Session already completed");
    }

    const { notes, sessionOutcome } = req.body || {};

    session.status = "completed";
    session.sessionEndedAt = new Date();

    if (notes) {
      session.notes = notes;
    }

    if (sessionOutcome) {
      session.sessionOutcome = sessionOutcome;
    }

    let durationMinutes = null;
    if (session.sessionStartedAt) {
      durationMinutes = Math.max(
        1,
        Math.round((session.sessionEndedAt - session.sessionStartedAt) / 60000)
      );
      session.durationMinutes = durationMinutes;
    }

    await session.save();

    await publishEvent("notification.telemedicine.session.completed", {
      sessionId: session._id.toString(),
      appointmentId: session.appointmentId,
      patientId: session.patientId,
      doctorId: session.doctorId,
      durationMinutes,
      sessionOutcome: session.sessionOutcome
    });

    return sendSuccess(res, 200, {
      sessionId: session._id.toString(),
      status: session.status,
      durationMinutes,
      sessionEndedAt: session.sessionEndedAt
    });
  } catch (error) {
    return sendError(res, 500, error.message || "Failed to end session");
  }
};

export const cancelSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);

    if (!session) {
      return sendError(res, 404, "Session not found");
    }

    if (["completed", "cancelled"].includes(session.status)) {
      return sendError(res, 400, "Session already finalized");
    }

    session.status = "cancelled";
    session.sessionEndedAt = new Date();
    await session.save();

    await publishEvent("notification.telemedicine.session.cancelled", {
      sessionId: session._id.toString(),
      appointmentId: session.appointmentId,
      patientId: session.patientId,
      doctorId: session.doctorId
    });

    return sendSuccess(res, 200, {
      sessionId: session._id.toString(),
      status: session.status
    });
  } catch (error) {
    return sendError(res, 500, error.message || "Failed to cancel session");
  }
};

export const getSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);

    if (!session) {
      return sendError(res, 404, "Session not found");
    }

    if (!isAdmin(req.user) && !isParticipant(session, req.user)) {
      return sendError(res, 403, "Forbidden");
    }

    return sendSuccess(res, 200, {
      session: session.toObject({ virtuals: true })
    });
  } catch (error) {
    return sendError(res, 500, error.message || "Failed to get session");
  }
};

export const getSessionByAppointment = async (req, res) => {
  try {
    const session = await Session.findOne({ appointmentId: req.params.appointmentId });

    if (!session) {
      return sendError(res, 404, "Session not found");
    }

    if (!isAdmin(req.user) && !isParticipant(session, req.user)) {
      return sendError(res, 403, "Forbidden");
    }

    return sendSuccess(res, 200, {
      session: session.toObject({ virtuals: true })
    });
  } catch (error) {
    return sendError(res, 500, error.message || "Failed to get session");
  }
};

export const getDoctorSessions = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const skip = (page - 1) * limit;

    const query = { doctorId: req.user.userId };
    if (req.query.status) {
      query.status = req.query.status;
    }

    const [sessions, total] = await Promise.all([
      Session.find(query).sort({ scheduledAt: 1 }).skip(skip).limit(limit).lean({ virtuals: true }),
      Session.countDocuments(query)
    ]);

    return sendSuccess(res, 200, {
      sessions,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    return sendError(res, 500, error.message || "Failed to list sessions");
  }
};

export const getPatientSessions = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const skip = (page - 1) * limit;

    const query = { patientId: req.user.userId };
    if (req.query.status) {
      query.status = req.query.status;
    }

    const [sessions, total] = await Promise.all([
      Session.find(query).sort({ scheduledAt: 1 }).skip(skip).limit(limit).lean({ virtuals: true }),
      Session.countDocuments(query)
    ]);

    return sendSuccess(res, 200, {
      sessions,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    return sendError(res, 500, error.message || "Failed to list sessions");
  }
};

export const getInternalSessionByAppointment = async (req, res) => {
  try {
    const session = await Session.findOne({ appointmentId: req.params.appointmentId });

    if (!session) {
      return sendError(res, 404, "Session not found");
    }

    return sendSuccess(res, 200, {
      session: session.toObject({ virtuals: true })
    });
  } catch (error) {
    return sendError(res, 500, error.message || "Failed to get session");
  }
};
