import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/apiResponse.js";
import {
  addPatientReport,
  deletePatientReport,
  cancelPatientAppointment,
  confirmPatientAppointmentAttendance,
  getPatientAppointmentById,
  getPatientAppointments,
  getPatientForInternalService,
  getPatientHistory,
  getPatientPrescriptions,
  getPatientProfile,
  getPatientReports,
  reschedulePatientAppointment,
  updatePatientProfile
} from "../services/patient.service.js";

export const handleGetProfile = asyncHandler(async (req, res) => {
  const profile = await getPatientProfile(req.user);
  return sendResponse(res, 200, "Patient profile fetched", profile);
});

export const handleUpdateProfile = asyncHandler(async (req, res) => {
  const profile = await updatePatientProfile(req.user, req.body);
  return sendResponse(res, 200, "Patient profile updated", profile);
});

export const handleUploadReport = asyncHandler(async (req, res) => {
  const report = await addPatientReport(req.user, req.file);
  return sendResponse(res, 201, "Report uploaded successfully", report);
});

export const handleGetReports = asyncHandler(async (req, res) => {
  const reports = await getPatientReports(req.user);
  return sendResponse(res, 200, "Patient reports fetched", reports);
});

export const handleDeleteReport = asyncHandler(async (req, res) => {
  const report = await deletePatientReport(req.user, {
    publicId: req.body?.publicId,
    url: req.body?.url
  });
  return sendResponse(res, 200, "Report deleted successfully", report);
});

export const handleGetHistory = asyncHandler(async (req, res) => {
  const history = await getPatientHistory({
    user: req.user,
    authorization: req.headers.authorization,
    query: req.query
  });

  return sendResponse(res, 200, "Patient history fetched", history);
});

export const handleGetPrescriptions = asyncHandler(async (req, res) => {
  const prescriptions = await getPatientPrescriptions({
    user: req.user,
    authorization: req.headers.authorization,
    query: req.query
  });

  return sendResponse(res, 200, "Patient prescriptions fetched", prescriptions);
});

export const handleGetPatientInternal = asyncHandler(async (req, res) => {
  const patient = await getPatientForInternalService(req.params.patientId);
  return sendResponse(res, 200, "Internal patient profile fetched", patient);
});

export const handleGetAppointments = asyncHandler(async (req, res) => {
  const appointments = await getPatientAppointments({
    authorization: req.headers.authorization,
    query: req.query
  });

  return sendResponse(res, 200, "Patient appointments fetched", appointments);
});

export const handleGetAppointment = asyncHandler(async (req, res) => {
  const appointment = await getPatientAppointmentById({
    appointmentId: req.params.appointmentId,
    authorization: req.headers.authorization
  });

  return sendResponse(res, 200, "Patient appointment fetched", appointment);
});

export const handleCancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await cancelPatientAppointment({
    appointmentId: req.params.appointmentId,
    authorization: req.headers.authorization,
    reason: req.body.reason,
    overridePolicy: req.body.overridePolicy
  });

  return sendResponse(res, 200, "Appointment cancelled", appointment);
});

export const handleRescheduleAppointment = asyncHandler(async (req, res) => {
  const appointment = await reschedulePatientAppointment({
    appointmentId: req.params.appointmentId,
    authorization: req.headers.authorization,
    newStartTime: req.body.newStartTime,
    newEndTime: req.body.newEndTime
  });

  return sendResponse(res, 200, "Appointment rescheduled", appointment);
});

export const handleConfirmAppointmentAttendance = asyncHandler(async (req, res) => {
  const appointment = await confirmPatientAppointmentAttendance({
    appointmentId: req.params.appointmentId,
    authorization: req.headers.authorization
  });

  return sendResponse(res, 200, "Attendance updated", appointment);
});
