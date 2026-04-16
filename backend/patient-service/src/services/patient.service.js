import Patient from "../models/Patient.js";
import AppError from "../utils/AppError.js";
import { deleteReportByPublicId, uploadReportBuffer } from "./storage.service.js";
import {
  cancelAppointmentInAppointmentService,
  confirmAppointmentAttendanceInAppointmentService,
  fetchHistoryFromAppointmentService,
  fetchAppointmentByIdFromAppointmentService,
  fetchAppointmentsFromAppointmentService,
  fetchPrescriptionsFromUpstream
  ,
  rescheduleAppointmentInAppointmentService
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

const isPdfReport = (report) => {
  const mimeType = (report?.mimeType || "").toLowerCase();
  const filename = (report?.filename || "").toLowerCase();
  const url = (report?.url || "").toLowerCase();

  return (
    mimeType === "application/pdf" ||
    filename.endsWith(".pdf") ||
    url.endsWith(".pdf")
  );
};

const getDownloadCandidates = (report) => {
  const primaryUrl = typeof report?.url === "string" ? report.url.trim() : "";

  if (!primaryUrl) {
    return [];
  }

  const candidates = [primaryUrl];
  const isCloudinaryUrl = primaryUrl.includes("res.cloudinary.com") && primaryUrl.includes("/upload/");

  if (isCloudinaryUrl && isPdfReport(report)) {
    if (primaryUrl.includes("/image/upload/")) {
      candidates.push(primaryUrl.replace("/image/upload/", "/raw/upload/"));
      candidates.push(primaryUrl.replace("/image/upload/", "/image/upload/fl_attachment/"));
      candidates.push(primaryUrl.replace("/image/upload/", "/raw/upload/fl_attachment/"));
    } else if (primaryUrl.includes("/raw/upload/")) {
      candidates.push(primaryUrl.replace("/raw/upload/", "/raw/upload/fl_attachment/"));
    }
  }

  return Array.from(new Set(candidates));
};

const fetchReportFromCandidates = async (candidates) => {
  let lastStatus = null;
  let lastStatusText = null;
  let lastUrl = null;
  let lastCloudinaryError = null;

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate);

      if (response.ok && response.body) {
        return { upstreamResponse: response, sourceUrl: candidate };
      }

      lastStatus = response.status;
      lastStatusText = response.statusText;
      lastUrl = candidate;
      lastCloudinaryError = response.headers.get("x-cld-error");
    } catch (error) {
      lastStatus = null;
      lastStatusText = error?.message || "Network error";
      lastUrl = candidate;
      lastCloudinaryError = null;
    }
  }

  if (
    lastStatus === 401 &&
    typeof lastCloudinaryError === "string" &&
    lastCloudinaryError.toLowerCase().includes("deny")
  ) {
    throw new AppError(
      "PDF delivery is blocked by Cloudinary security settings. Enable PDF/ZIP delivery in Cloudinary and re-upload the file.",
      502,
      "PDF_DELIVERY_BLOCKED",
      {
        lastUrl,
        lastStatus,
        lastStatusText,
        cloudinaryError: lastCloudinaryError
      }
    );
  }

  throw new AppError("Failed to load report file", 502, "REPORT_DOWNLOAD_FAILED", {
    lastUrl,
    lastStatus,
    lastStatusText,
    cloudinaryError: lastCloudinaryError
  });
};

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
    filename: file.originalname,
    mimeType: file.mimetype
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

export const getPatientReportDownload = async (user, identifier = {}) => {
  const normalizedPublicId =
    typeof identifier?.publicId === "string" ? identifier.publicId.trim() : "";
  const normalizedUrl = typeof identifier?.url === "string" ? identifier.url.trim() : "";

  if (!normalizedPublicId && !normalizedUrl) {
    throw new AppError("Report identifier is required", 400, "REPORT_ID_REQUIRED");
  }

  const patient = await getOrCreatePatientByUser(user);

  const report = patient.reports.find(
    (item) =>
      (normalizedPublicId && item.publicId === normalizedPublicId) ||
      (normalizedUrl && item.url === normalizedUrl)
  );

  if (!report) {
    throw new AppError("Report not found", 404, "REPORT_NOT_FOUND");
  }

  if (!report.url) {
    throw new AppError("Report file URL is missing", 404, "REPORT_URL_MISSING");
  }

  const candidates = getDownloadCandidates(report);
  const { upstreamResponse } = await fetchReportFromCandidates(candidates);

  return { report, upstreamResponse };
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

export const getPatientAppointments = async ({ authorization, query }) => {
  return await fetchAppointmentsFromAppointmentService({
    authorization,
    page: query.page,
    limit: query.limit,
    status: query.status,
    from: query.from,
    to: query.to
  });
};

export const getPatientAppointmentById = async ({ appointmentId, authorization }) => {
  return await fetchAppointmentByIdFromAppointmentService({
    appointmentId,
    authorization
  });
};

export const cancelPatientAppointment = async ({ appointmentId, authorization, reason, overridePolicy }) => {
  return await cancelAppointmentInAppointmentService({
    appointmentId,
    authorization,
    reason,
    overridePolicy
  });
};

export const reschedulePatientAppointment = async ({ appointmentId, authorization, newStartTime, newEndTime }) => {
  return await rescheduleAppointmentInAppointmentService({
    appointmentId,
    authorization,
    newStartTime,
    newEndTime
  });
};

export const confirmPatientAppointmentAttendance = async ({ appointmentId, authorization }) => {
  return await confirmAppointmentAttendanceInAppointmentService({
    appointmentId,
    authorization
  });
};

export const getPatientForInternalService = async (patientId) => {
  const patient = await Patient.findOne({ userId: patientId }, profileProjection).lean();

  if (!patient) {
    throw new AppError("Patient not found", 404, "PATIENT_NOT_FOUND");
  }

  return patient;
};
