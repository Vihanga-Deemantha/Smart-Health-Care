import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/apiResponse.js";
import AppError from "../utils/AppError.js";
import {
  listDoctors,
  getDoctorById,
  createDoctor,
  listInternalDoctors,
  getInternalDoctor,
  updateDoctorAvailability,
  updateDoctorProfile,
  uploadDoctorProfilePhoto,
  addDoctorQualificationDocument
} from "../services/doctor.service.js";
import { respondToAppointment, getTelemedicineSession } from "../services/appointment.service.js";
import { getPatientReportsForDoctor } from "../services/patientReport.service.js";
import {
  createPrescription,
  listPrescriptionsForPatient
} from "../services/prescription.service.js";

export const handleListDoctors = asyncHandler(async (req, res) => {
  const doctors = await listDoctors(req.query);
  sendResponse(res, 200, "Doctors fetched successfully", { doctors });
});

export const handleListInternalDoctors = asyncHandler(async (req, res) => {
  const doctors = await listInternalDoctors(req.query);
  sendResponse(res, 200, "Internal doctors fetched", doctors);
});

export const handleGetDoctor = asyncHandler(async (req, res) => {
  const doctor = await getDoctorById(req.params.id);

  if (!doctor) {
    throw new AppError("Doctor not found", 404, "NOT_FOUND");
  }

  sendResponse(res, 200, "Doctor fetched successfully", { doctor });
});

export const handleGetInternalDoctor = asyncHandler(async (req, res) => {
  const doctor = await getInternalDoctor(req.params.id);

  if (!doctor) {
    throw new AppError("Doctor not found", 404, "NOT_FOUND");
  }

  sendResponse(res, 200, "Internal doctor fetched", doctor);
});

export const handleCreateDoctor = asyncHandler(async (req, res) => {
  const doctor = await createDoctor(req.body);
  sendResponse(res, 201, "Doctor created successfully", { doctor });
});

export const handleUpdateAvailability = asyncHandler(async (req, res) => {
  const doctor = await updateDoctorAvailability({
    doctorId: req.params.id,
    availability: req.body.availability,
    actorUserId: req.user.userId
  });

  sendResponse(res, 200, "Availability updated", { doctor });
});

export const handleUpdateProfile = asyncHandler(async (req, res) => {
  const doctor = await updateDoctorProfile({
    doctorId: req.params.id,
    payload: req.body,
    actorUserId: req.user.userId
  });

  sendResponse(res, 200, "Doctor profile updated", { doctor });
});

export const handleUploadDoctorProfilePhoto = asyncHandler(async (req, res) => {
  const doctor = await uploadDoctorProfilePhoto({
    doctorId: req.params.id,
    actorUserId: req.user.userId,
    file: req.file
  });

  sendResponse(res, 200, "Doctor profile photo updated", { doctor });
});

export const handleUploadQualificationDocument = asyncHandler(async (req, res) => {
  const doctor = await addDoctorQualificationDocument({
    doctorId: req.params.id,
    actorUserId: req.user.userId,
    payload: req.body,
    file: req.file
  });

  sendResponse(res, 200, "Qualification document uploaded", { doctor });
});

export const handleRespondToAppointment = asyncHandler(async (req, res) => {
  const response = await respondToAppointment({
    appointmentId: req.params.id,
    action: req.body.action,
    reason: req.body.reason,
    authorization: req.headers.authorization
  });

  sendResponse(res, 200, "Appointment response recorded", response?.data || response);
});

export const handleGetTelemedicineSession = asyncHandler(async (req, res) => {
  const session = await getTelemedicineSession({
    appointmentId: req.params.id,
    authorization: req.headers.authorization
  });

  sendResponse(res, 200, "Telemedicine session fetched", { session });
});

export const handleGetPatientReports = asyncHandler(async (req, res) => {
  const doctor = await getDoctorById(req.params.id);

  if (!doctor) {
    throw new AppError("Doctor not found", 404, "NOT_FOUND");
  }

  if (String(doctor.userId) !== String(req.user.userId)) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }

  const result = await getPatientReportsForDoctor({
    doctorId: req.user.userId,
    patientId: req.params.patientId
  });

  sendResponse(res, 200, "Patient reports fetched", result);
});

export const handleCreatePrescription = asyncHandler(async (req, res) => {
  const prescription = await createPrescription({
    doctorId: req.user.userId,
    patientId: req.body.patientId,
    appointmentId: req.body.appointmentId,
    medicines: req.body.medicines
  });

  sendResponse(res, 201, "Prescription issued", { prescription });
});

export const handleListPrescriptionsForPatient = asyncHandler(async (req, res) => {
  const prescriptions = await listPrescriptionsForPatient({
    patientId: req.params.patientId,
    limit: req.query.limit
  });

  sendResponse(res, 200, "Prescriptions fetched", { prescriptions });
});

export const handleListPrescriptionsForCurrentPatient = asyncHandler(async (req, res) => {
  const prescriptions = await listPrescriptionsForPatient({
    patientId: req.user.userId,
    limit: req.query.limit
  });

  sendResponse(res, 200, "Prescriptions fetched", { prescriptions });
});
