import { v4 as uuidv4 } from "uuid";
import Session from "../models/Session.js";
import { publishEvent } from "../config/rabbitmq.js";

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

    if (!session.isJoinable) {
      return sendError(res, 400, "Session is not joinable yet");
    }

    if (session.status === "scheduled") {
      session.status = "waiting";
      session.waitingStartedAt = new Date();
      if (!session.sessionStartedAt) {
        session.sessionStartedAt = new Date();
      }
    }

    await session.save();

    return sendSuccess(res, 200, {
      sessionId: session._id.toString(),
      channelName: session.channelName,
      jitsiRoomUrl: session.jitsiRoomUrl,
      provider: "jitsi",
      status: session.status,
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
