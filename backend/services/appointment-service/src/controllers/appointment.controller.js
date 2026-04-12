import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/apiResponse.js";
import {
  bookAppointment,
  cancelAppointment,
  confirmAttendance,
  createSlotHold,
  listAppointments,
  markNoShow,
  rescheduleAppointment
} from "../services/appointment.service.js";

export const handleCreateHold = asyncHandler(async (req, res) => {
  const hold = await createSlotHold({
    ...req.body,
    patientId: req.user.userId,
    actor: {
      id: req.user.userId,
      role: req.user.role
    }
  });

  return sendResponse(res, 201, "Slot hold created", hold);
});

export const handleCreateAppointment = asyncHandler(async (req, res) => {
  const appointment = await bookAppointment({
    ...req.body,
    patientId: req.user.userId,
    actor: {
      id: req.user.userId,
      role: req.user.role
    }
  });

  return sendResponse(res, 201, "Appointment booked", appointment);
});

export const handleCancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await cancelAppointment({
    appointmentId: req.params.id,
    reason: req.body.reason,
    overridePolicy: req.body.overridePolicy,
    actor: {
      id: req.user.userId,
      role: req.user.role
    }
  });

  return sendResponse(res, 200, "Appointment cancelled", appointment);
});

export const handleRescheduleAppointment = asyncHandler(async (req, res) => {
  const appointment = await rescheduleAppointment({
    appointmentId: req.params.id,
    newStartTime: req.body.newStartTime,
    newEndTime: req.body.newEndTime,
    actor: {
      id: req.user.userId,
      role: req.user.role
    }
  });

  return sendResponse(res, 200, "Appointment rescheduled", appointment);
});

export const handleConfirmAttendance = asyncHandler(async (req, res) => {
  const result = await confirmAttendance({
    appointmentId: req.params.id,
    actor: {
      id: req.user.userId,
      role: req.user.role
    }
  });

  return sendResponse(res, 200, "Attendance updated", result);
});

export const handleNoShow = asyncHandler(async (req, res) => {
  const result = await markNoShow({
    appointmentId: req.params.id,
    target: req.body.target,
    actor: {
      id: req.user.userId,
      role: req.user.role
    }
  });

  return sendResponse(res, 200, "No-show marked", result);
});

export const handleListAppointments = asyncHandler(async (req, res) => {
  const result = await listAppointments({
    userId: req.user.userId,
    role: req.user.role,
    ...req.query
  });

  return sendResponse(res, 200, "Appointments fetched", result);
});
