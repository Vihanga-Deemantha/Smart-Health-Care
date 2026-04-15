import Patient from "../models/Patient.js";
import AppError from "../utils/AppError.js";
import { deleteReportByPublicId, uploadReportBuffer } from "./storage.service.js";
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

const normalizeClaimValue = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

const defaultProfile = (user) => ({
  userId: user.userId,
  email: normalizeClaimValue(user.email) || null,
  fullName: normalizeClaimValue(user.fullName) || "Patient",
  contactNumber: normalizeClaimValue(user.phone || user.contactNumber) || null,
  allergies: []
});

const getOrCreatePatientByUser = async (user) => {
  let patient = await Patient.findOne({ userId: user.userId });

  if (!patient) {
    patient = await Patient.create(defaultProfile(user));
    return patient;
  }

  const fallbackEmail = normalizeClaimValue(user.email);
  const fallbackFullName = normalizeClaimValue(user.fullName);
  const fallbackContactNumber = normalizeClaimValue(user.phone || user.contactNumber);

  let shouldSave = false;

  if (!patient.email && fallbackEmail) {
    patient.email = fallbackEmail;
    shouldSave = true;
  }

  if ((!patient.fullName || patient.fullName === "Patient") && fallbackFullName) {
    patient.fullName = fallbackFullName;
    shouldSave = true;
  }

  if (!patient.contactNumber && fallbackContactNumber) {
    patient.contactNumber = fallbackContactNumber;
    shouldSave = true;
  }

  if (shouldSave) {
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
    resourceType: uploaded.resource_type || null,
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

export const deletePatientReport = async (user, identifier = {}) => {
  const normalizedPublicId =
    typeof identifier?.publicId === "string" ? identifier.publicId.trim() : "";
  const normalizedUrl = typeof identifier?.url === "string" ? identifier.url.trim() : "";

  if (!normalizedPublicId && !normalizedUrl) {
    throw new AppError("Report identifier is required", 400, "REPORT_ID_REQUIRED");
  }

  const patient = await getOrCreatePatientByUser(user);

  const reportIndex = patient.reports.findIndex(
    (report) =>
      (normalizedPublicId && report.publicId === normalizedPublicId) ||
      (normalizedUrl && report.url === normalizedUrl)
  );
  if (reportIndex === -1) {
    throw new AppError("Report not found", 404, "REPORT_NOT_FOUND");
  }

  const report = patient.reports[reportIndex];

  if (report.publicId) {
    await deleteReportByPublicId({
      publicId: report.publicId,
      resourceType: report.resourceType || null
    });
  }

  patient.reports.splice(reportIndex, 1);
  await patient.save();

  return report;
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
