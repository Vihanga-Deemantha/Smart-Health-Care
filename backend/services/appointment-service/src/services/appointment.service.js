import mongoose from "mongoose";
import { addMinutes, differenceInHours } from "date-fns";
import Appointment from "../models/Appointment.js";
import SlotHold from "../models/SlotHold.js";
import Attendance from "../models/Attendance.js";
import Waitlist from "../models/Waitlist.js";
import AppError from "../utils/AppError.js";
import { APPOINTMENT_STATUS, CONSULTATION_MODE, USER_ROLES } from "../utils/constants.js";
import { assignRoom } from "../integrations/roomService.client.js";
import { createTelemedicineMeeting } from "../integrations/googleCalendar.client.js";
import { getDoctorProfile } from "../integrations/doctorService.client.js";
import { getPatientProfile } from "../integrations/patientService.client.js";
import { createTelemedicineSession } from "../integrations/telemedicineService.client.js";
import { createAuditLog } from "./audit.service.js";
import { publishEvent } from "../events/publishers/eventPublisher.js";
import { holdExpiryQueue, reminderQueue, waitlistQueue } from "../config/redis.js";

const slotHoldTtlMinutes = Number(process.env.SLOT_HOLD_TTL_MINUTES || 10);
const maxActiveHolds = Number(process.env.MAX_ACTIVE_HOLDS_PER_PATIENT || 3);
const cancellationCutoffHours = Number(process.env.CANCELLATION_CUTOFF_HOURS || 12);

const dateOnly = (value) => new Date(value).toISOString().slice(0, 10);

const buildPatientSummary = (profile, patientId) => {
  if (!profile && !patientId) {
    return null;
  }

  return {
    userId: profile?.userId || profile?._id || profile?.id || patientId || null,
    fullName: profile?.fullName || profile?.name || "Patient",
    email: profile?.email || null,
    phone: profile?.contactNumber || profile?.phone || null
  };
};

const enrichAppointmentsWithPatients = async (appointments, role) => {
  const canSeePatient = [
    USER_ROLES.DOCTOR,
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.STAFF
  ].includes(role);

  if (!canSeePatient || !appointments?.length) {
    return appointments;
  }

  const patientIds = Array.from(
    new Set(appointments.map((appointment) => appointment.patientId).filter(Boolean))
  );

  if (!patientIds.length) {
    return appointments;
  }

  const patientProfiles = await Promise.all(patientIds.map((id) => getPatientProfile(id)));
  const patientMap = new Map();

  patientIds.forEach((id, index) => {
    patientMap.set(id, buildPatientSummary(patientProfiles[index], id));
  });

  return appointments.map((appointment) => {
    if (appointment?.patient && typeof appointment.patient === "object") {
      const hasDetails =
        appointment.patient.fullName ||
        appointment.patient.name ||
        appointment.patient.email ||
        appointment.patient.phone ||
        appointment.patient.contactNumber;
      if (hasDetails) {
        return appointment;
      }
    }

    const summary = patientMap.get(appointment.patientId);
    if (!summary) {
      return appointment;
    }

    return { ...appointment, patient: summary };
  });
};

export const createSlotHold = async ({ patientId, doctorId, startTime, endTime, actor }) => {
  const activeHolds = await SlotHold.countDocuments({
    patientId,
    status: "ACTIVE",
    expiresAt: { $gt: new Date() }
  });

  if (activeHolds >= maxActiveHolds) {
    throw new AppError("Active hold limit reached", 429, "HOLD_LIMIT_REACHED");
  }

  const existingAppointment = await Appointment.findOne({ doctorId, startTime });
  if (existingAppointment) {
    throw new AppError("Slot already booked", 409, "SLOT_ALREADY_BOOKED");
  }

  const existingHold = await SlotHold.findOne({
    doctorId,
    startTime,
    status: "ACTIVE",
    expiresAt: { $gt: new Date() }
  });

  if (existingHold) {
    throw new AppError("Slot currently held", 409, "SLOT_HELD");
  }

  const hold = await SlotHold.create({
    doctorId,
    patientId,
    startTime,
    endTime,
    expiresAt: addMinutes(new Date(), slotHoldTtlMinutes)
  });

  await createAuditLog({
    entityType: "SLOT_HOLD",
    entityId: hold._id.toString(),
    action: "HOLD_CREATED",
    actorId: actor.id,
    actorRole: actor.role,
    metadata: { doctorId, patientId, startTime, endTime }
  });

  await publishEvent("appointment.hold.created", {
    holdId: hold._id.toString(),
    doctorId,
    patientId,
    startTime,
    endTime
  });

  if (holdExpiryQueue) {
    await holdExpiryQueue.add(
      "release-slot-hold",
      { holdId: hold._id.toString() },
      { delay: slotHoldTtlMinutes * 60 * 1000, attempts: 3, removeOnComplete: true }
    );
  }

  return hold;
};

export const bookAppointment = async ({ holdId, patientId, doctorId, mode, hospitalId, reason, actor }) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const [doctorProfile, patientProfile] = await Promise.all([
      getDoctorProfile(doctorId),
      getPatientProfile(patientId)
    ]);

    const hold = await SlotHold.findOne({
      _id: holdId,
      patientId,
      doctorId,
      status: "ACTIVE",
      expiresAt: { $gt: new Date() }
    }).session(session);

    if (!hold) {
      throw new AppError("Hold not found or expired", 404, "HOLD_NOT_ACTIVE");
    }

    const appointmentPayload = {
      patientId,
      doctorId,
      hospitalId: hospitalId || null,
      appointmentDate: dateOnly(hold.startTime),
      startTime: hold.startTime,
      endTime: hold.endTime,
      mode,
      status: APPOINTMENT_STATUS.BOOKED,
      reason,
      statusTimestamps: {
        bookedAt: new Date()
      }
    };

    if (mode === CONSULTATION_MODE.TELEMEDICINE) {
      const telemedicineSession = await createTelemedicineSession({
        appointmentId: hold._id.toString(),
        doctorId,
        patientId,
        startTime: hold.startTime,
        endTime: hold.endTime
      });

      const meet = telemedicineSession
        ? {
            meetingLink: telemedicineSession.meetingLink,
            calendarEventId: telemedicineSession.sessionId || null
          }
        : await createTelemedicineMeeting({
            doctorEmail: doctorProfile?.email,
            patientEmail: patientProfile?.email,
            startTime: hold.startTime,
            endTime: hold.endTime,
            summary: "Smart Healthcare Consultation"
          });

      appointmentPayload.telemedicine = {
        provider: telemedicineSession ? "TELEMEDICINE_SERVICE" : "GOOGLE_MEET",
        meetingLink: meet.meetingLink,
        calendarEventId: meet.calendarEventId
      };

      await publishEvent("telemedicine.appointment.scheduled", {
        doctorId,
        patientId,
        startTime: hold.startTime,
        endTime: hold.endTime
      });
    }

    if (mode === CONSULTATION_MODE.IN_PERSON) {
      try {
        const room = await assignRoom({
          hospitalId,
          startTime: hold.startTime,
          endTime: hold.endTime,
          doctorId
        });

        appointmentPayload.inPerson = room
          ? {
              roomId: room.roomId,
              roomName: room.roomName,
              floor: room.floor
            }
          : {};
      } catch (roomError) {
        // Room assignment is best-effort; appointment booking should still succeed.
        appointmentPayload.inPerson = {};
      }
    }

    const appointment = await Appointment.create([appointmentPayload], { session });

    await Attendance.create(
      [
        {
          appointmentId: appointment[0]._id
        }
      ],
      { session }
    );

    hold.status = "CONVERTED";
    hold.releasedAt = new Date();
    hold.releaseReason = "BOOKED";
    await hold.save({ session });

    await session.commitTransaction();

    await createAuditLog({
      appointmentId: appointment[0]._id,
      entityType: "APPOINTMENT",
      entityId: appointment[0]._id.toString(),
      action: "APPOINTMENT_BOOKED",
      actorId: actor.id,
      actorRole: actor.role,
      metadata: { mode }
    });

    await publishEvent("appointment.booked", {
      appointmentId: appointment[0]._id.toString(),
      doctorId,
      patientId,
      mode,
      startTime: hold.startTime,
      endTime: hold.endTime
    });

    await publishEvent("notification.appointment.created", {
      appointmentId: appointment[0]._id.toString(),
      doctorId,
      patientId,
      mode,
      startTime: hold.startTime,
      endTime: hold.endTime,
      meetingLink: appointment[0].telemedicine?.meetingLink || null
    });

    await publishEvent("payment.appointment.booking_created", {
      appointmentId: appointment[0]._id.toString(),
      doctorId,
      patientId,
      mode,
      startTime: hold.startTime,
      endTime: hold.endTime
    });

    if (reminderQueue) {
      const startTs = new Date(hold.startTime).getTime();
      const now = Date.now();
      const reminder24hDelay = Math.max(startTs - now - 24 * 60 * 60 * 1000, 0);
      const reminder1hDelay = Math.max(startTs - now - 60 * 60 * 1000, 0);

      await reminderQueue.add(
        "appointment-reminder-24h",
        { appointmentId: appointment[0]._id.toString(), type: "24H" },
        { delay: reminder24hDelay, attempts: 5, removeOnComplete: true }
      );

      await reminderQueue.add(
        "appointment-reminder-1h",
        { appointmentId: appointment[0]._id.toString(), type: "1H" },
        { delay: reminder1hDelay, attempts: 5, removeOnComplete: true }
      );
    }

    return appointment[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const cancelAppointment = async ({ appointmentId, actor, reason, overridePolicy = false }) => {
  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw new AppError("Appointment not found", 404, "APPOINTMENT_NOT_FOUND");
  }

  const hoursLeft = differenceInHours(appointment.startTime, new Date());
  const isAdmin = [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.STAFF].includes(
    actor.role
  );

  if (!overridePolicy && !isAdmin && hoursLeft < cancellationCutoffHours) {
    throw new AppError("Cancellation cutoff exceeded", 409, "CANCELLATION_CUTOFF_EXCEEDED");
  }

  const oldStatus = appointment.status;

  appointment.status = APPOINTMENT_STATUS.CANCELLED;
  appointment.statusTimestamps.cancelledAt = new Date();
  appointment.cancellation = {
    cancelledBy: actor.id,
    cancelledByRole: actor.role,
    reason,
    policyOverride: Boolean(overridePolicy)
  };

  await appointment.save();

  await createAuditLog({
    appointmentId: appointment._id,
    entityType: "APPOINTMENT",
    entityId: appointment._id.toString(),
    action: "APPOINTMENT_CANCELLED",
    actorId: actor.id,
    actorRole: actor.role,
    oldValue: { status: oldStatus },
    newValue: { status: appointment.status },
    metadata: { reason }
  });

  await publishEvent("appointment.cancelled", {
    appointmentId: appointment._id.toString(),
    doctorId: appointment.doctorId,
    patientId: appointment.patientId,
    reason
  });

  await publishEvent("notification.appointment.cancelled", {
    appointmentId: appointment._id.toString(),
    doctorId: appointment.doctorId,
    patientId: appointment.patientId,
    startTime: appointment.startTime,
    reason
  });

  if (waitlistQueue) {
    await waitlistQueue.add(
      "waitlist-promote",
      {
        doctorId: appointment.doctorId,
        mode: appointment.mode,
        startTime: appointment.startTime,
        endTime: appointment.endTime
      },
      { attempts: 3, backoff: { type: "exponential", delay: 3000 } }
    );
  }

  return appointment;
};

export const rescheduleAppointment = async ({ appointmentId, newStartTime, newEndTime, actor }) => {
  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw new AppError("Appointment not found", 404, "APPOINTMENT_NOT_FOUND");
  }

  const conflict = await Appointment.findOne({
    _id: { $ne: appointmentId },
    doctorId: appointment.doctorId,
    startTime: new Date(newStartTime)
  });

  if (conflict) {
    throw new AppError("Requested slot is unavailable", 409, "SLOT_UNAVAILABLE");
  }

  const oldValue = {
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    status: appointment.status
  };

  appointment.startTime = new Date(newStartTime);
  appointment.endTime = new Date(newEndTime);
  appointment.appointmentDate = dateOnly(newStartTime);
  appointment.status = APPOINTMENT_STATUS.RESCHEDULED;
  appointment.statusTimestamps.rescheduledAt = new Date();

  await appointment.save();

  await createAuditLog({
    appointmentId: appointment._id,
    entityType: "APPOINTMENT",
    entityId: appointment._id.toString(),
    action: "APPOINTMENT_RESCHEDULED",
    actorId: actor.id,
    actorRole: actor.role,
    oldValue,
    newValue: {
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status
    }
  });

  await publishEvent("appointment.rescheduled", {
    appointmentId: appointment._id.toString(),
    doctorId: appointment.doctorId,
    patientId: appointment.patientId,
    startTime: appointment.startTime,
    endTime: appointment.endTime
  });

  return appointment;
};

export const confirmAttendance = async ({ appointmentId, actor }) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new AppError("Appointment not found", 404, "APPOINTMENT_NOT_FOUND");
  }

  const attendance = await Attendance.findOne({ appointmentId: appointment._id });
  if (!attendance) {
    throw new AppError("Attendance record missing", 404, "ATTENDANCE_NOT_FOUND");
  }

  if (actor.role === USER_ROLES.PATIENT) {
    attendance.patientConfirmedAt = new Date();
    attendance.patientConfirmedBy = actor.id;
  }

  if (actor.role === USER_ROLES.DOCTOR) {
    attendance.doctorConfirmedAt = new Date();
    attendance.doctorConfirmedBy = actor.id;
  }

  const bothConfirmed = Boolean(attendance.patientConfirmedAt && attendance.doctorConfirmedAt);

  attendance.status = bothConfirmed ? "CONFIRMED" : "PARTIAL";
  await attendance.save();

  if (bothConfirmed) {
    appointment.status = APPOINTMENT_STATUS.CONFIRMED;
    appointment.statusTimestamps.confirmedAt = new Date();
    await appointment.save();

    await publishEvent("appointment.confirmed", {
      appointmentId: appointment._id.toString(),
      doctorId: appointment.doctorId,
      patientId: appointment.patientId
    });
  }

  return { appointment, attendance };
};

export const markNoShow = async ({ appointmentId, actor, target }) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new AppError("Appointment not found", 404, "APPOINTMENT_NOT_FOUND");
  }

  appointment.status = APPOINTMENT_STATUS.NO_SHOW;
  appointment.statusTimestamps.noShowAt = new Date();
  appointment.metadata.noShowTarget = target;
  await appointment.save();

  await createAuditLog({
    appointmentId: appointment._id,
    entityType: "APPOINTMENT",
    entityId: appointment._id.toString(),
    action: "APPOINTMENT_NO_SHOW",
    actorId: actor.id,
    actorRole: actor.role,
    metadata: { target }
  });

  await publishEvent("appointment.no_show", {
    appointmentId: appointment._id.toString(),
    doctorId: appointment.doctorId,
    patientId: appointment.patientId,
    target
  });

  return appointment;
};

export const listAppointments = async ({ userId, role, status, from, to, page = 1, limit = 20 }) => {
  const query = {};

  if (status) {
    query.status = status;
  }

  if (from || to) {
    query.startTime = {};
    if (from) query.startTime.$gte = new Date(from);
    if (to) query.startTime.$lte = new Date(to);
  }

  if (role === USER_ROLES.PATIENT) {
    query.patientId = userId;
  }

  if (role === USER_ROLES.DOCTOR) {
    query.doctorId = userId;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Appointment.find(query).sort({ startTime: 1 }).skip(skip).limit(Number(limit)).lean(),
    Appointment.countDocuments(query)
  ]);

  const enrichedItems = await enrichAppointmentsWithPatients(items, role);

  return {
    items: enrichedItems,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit))
    }
  };
};

export const getAppointmentById = async ({ appointmentId, actor }) => {
  const appointment = await Appointment.findById(appointmentId).lean();

  if (!appointment) {
    throw new AppError("Appointment not found", 404, "APPOINTMENT_NOT_FOUND");
  }

  const isAdmin = [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.STAFF].includes(
    actor.role
  );

  if (!isAdmin) {
    if (actor.role === USER_ROLES.DOCTOR && String(appointment.doctorId) !== String(actor.id)) {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }

    if (actor.role === USER_ROLES.PATIENT && String(appointment.patientId) !== String(actor.id)) {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }
  }

  return appointment;
};

export const respondToAppointment = async ({ appointmentId, action, reason, actor }) => {
  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw new AppError("Appointment not found", 404, "APPOINTMENT_NOT_FOUND");
  }

  if (actor.role !== USER_ROLES.DOCTOR) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }

  if (String(appointment.doctorId) !== String(actor.id)) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }

  if (
    [
      APPOINTMENT_STATUS.CANCELLED,
      APPOINTMENT_STATUS.COMPLETED,
      APPOINTMENT_STATUS.NO_SHOW
    ].includes(appointment.status)
  ) {
    throw new AppError("Appointment cannot be updated", 409, "APPOINTMENT_FINALIZED");
  }

  const normalizedAction = String(action || "").toUpperCase();

  if (normalizedAction === "REJECT") {
    return cancelAppointment({
      appointmentId,
      reason: reason || "Rejected by doctor",
      overridePolicy: true,
      actor
    });
  }

  if (normalizedAction !== "ACCEPT") {
    throw new AppError("Invalid appointment action", 400, "INVALID_ACTION");
  }

  const oldStatus = appointment.status;

  appointment.status = APPOINTMENT_STATUS.CONFIRMED;
  appointment.statusTimestamps.confirmedAt = new Date();
  await appointment.save();

  let attendance = await Attendance.findOne({ appointmentId: appointment._id });

  if (!attendance) {
    attendance = await Attendance.create({ appointmentId: appointment._id });
  }

  attendance.doctorConfirmedAt = new Date();
  attendance.doctorConfirmedBy = actor.id;
  attendance.status = "CONFIRMED";
  await attendance.save();

  await createAuditLog({
    appointmentId: appointment._id,
    entityType: "APPOINTMENT",
    entityId: appointment._id.toString(),
    action: "APPOINTMENT_CONFIRMED",
    actorId: actor.id,
    actorRole: actor.role,
    oldValue: { status: oldStatus },
    newValue: { status: appointment.status }
  });

  await publishEvent("appointment.confirmed", {
    appointmentId: appointment._id.toString(),
    doctorId: appointment.doctorId,
    patientId: appointment.patientId
  });

  return appointment;
};

export const getTelemedicineSession = async ({ appointmentId, actor }) => {
  const appointment = await getAppointmentById({ appointmentId, actor });

  if (appointment.mode !== CONSULTATION_MODE.TELEMEDICINE) {
    throw new AppError("Appointment is not telemedicine", 409, "APPOINTMENT_NOT_TELEMEDICINE");
  }

  return {
    appointmentId: appointment._id || appointment.id || appointmentId,
    roomUrl: appointment.telemedicine?.meetingLink || null,
    meetingLink: appointment.telemedicine?.meetingLink || null,
    provider: appointment.telemedicine?.provider || null,
    calendarEventId: appointment.telemedicine?.calendarEventId || null,
    startTime: appointment.startTime,
    endTime: appointment.endTime
  };
};

export const promoteWaitlistForSlot = async ({ doctorId, mode, startTime, endTime }) => {
  const candidate = await Waitlist.findOne({
    doctorId,
    mode,
    status: "ACTIVE",
    preferredFrom: { $lte: new Date(startTime) },
    preferredTo: { $gte: new Date(endTime) }
  })
    .sort({ priority: -1, createdAt: 1 })
    .exec();

  if (!candidate) {
    return null;
  }

  candidate.status = "PROMOTED";
  await candidate.save();

  await publishEvent("waitlist.promoted", {
    waitlistId: candidate._id.toString(),
    doctorId: candidate.doctorId,
    patientId: candidate.patientId,
    startTime,
    endTime
  });

  await publishEvent("notification.waitlist.promoted", {
    waitlistId: candidate._id.toString(),
    doctorId: candidate.doctorId,
    patientId: candidate.patientId,
    startTime,
    endTime
  });

  return candidate;
};
