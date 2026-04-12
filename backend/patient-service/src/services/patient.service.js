import Patient from "../models/Patient.js";
import AppError from "../utils/AppError.js";
import { uploadReportBuffer } from "./storage.service.js";
import {
  fetchHistoryFromAppointmentService,
  fetchPrescriptionsFromUpstream
} from "./upstream.service.js";

const profileProjection = {
  _id: 0,
  userId: 1,
  email: 1,
  fullName: 1,
  dateOfBirth: 1,
  bloodGroup: 1,
  contactNumber: 1,
  address: 1,
  allergies: 1,
  reports: 1,
  medicalNotes: 1,
  createdAt: 1,
  updatedAt: 1
};

const defaultProfile = (user) => ({
  userId: user.userId,
  email: user.email || null,
  fullName: user.fullName || "Patient",
  allergies: []
});

const getOrCreatePatientByUser = async (user) => {
  let patient = await Patient.findOne({ userId: user.userId });

  if (!patient) {
    patient = await Patient.create(defaultProfile(user));
    return patient;
  }

  if (!patient.email && user.email) {
    patient.email = user.email;
    await patient.save();
  }

  return patient;
};

export const getPatientProfile = async (user) => {
  const patient = await getOrCreatePatientByUser(user);
  return patient.toObject({ versionKey: false });
};

export const updatePatientProfile = async (user, payload) => {
  const patient = await getOrCreatePatientByUser(user);

  const allowedFields = [
    "email",
    "fullName",
    "dateOfBirth",
    "bloodGroup",
    "contactNumber",
    "address",
    "allergies",
    "medicalNotes"
  ];

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      patient[field] = payload[field];
    }
  }

  await patient.save();

  return patient.toObject({ versionKey: false });
};

export const addPatientReport = async (user, file) => {
  if (!file) {
    throw new AppError("Report file is required", 400, "FILE_REQUIRED");
  }

  const patient = await getOrCreatePatientByUser(user);
  const uploaded = await uploadReportBuffer({
    buffer: file.buffer,
    filename: file.originalname
  });

  const report = {
    filename: file.originalname,
    url: uploaded.secure_url,
    publicId: uploaded.public_id,
    mimeType: file.mimetype,
    size: file.size,
    uploadDate: new Date()
  };

  patient.reports.unshift(report);
  await patient.save();

  return report;
};

export const getPatientReports = async (user) => {
  const patient = await getOrCreatePatientByUser(user);

  return patient.reports
    .slice()
    .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
};

export const getPatientHistory = async ({ user, authorization, query }) => {
  const historyData = await fetchHistoryFromAppointmentService({
    authorization,
    page: query.page,
    limit: query.limit,
    status: query.status
  });

  const items = Array.isArray(historyData?.items) ? historyData.items : [];
  const now = Date.now();

  return {
    ...historyData,
    items: items.filter((item) => {
      const appointmentTime = new Date(item.startTime || item.updatedAt || item.createdAt).getTime();
      return Number.isFinite(appointmentTime) && appointmentTime <= now;
    })
  };
};

export const getPatientPrescriptions = async ({ user, authorization, query }) => {
  return await fetchPrescriptionsFromUpstream({
    patientId: user.userId,
    authorization,
    limit: query.limit
  });
};

export const getPatientForInternalService = async (patientId) => {
  const patient = await Patient.findOne({ userId: patientId }, profileProjection).lean();

  if (!patient) {
    throw new AppError("Patient not found", 404, "PATIENT_NOT_FOUND");
  }

  return patient;
};
