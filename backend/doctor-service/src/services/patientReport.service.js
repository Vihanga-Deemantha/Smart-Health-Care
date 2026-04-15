import DoctorPatientReport from "../models/DoctorPatientReport.js";
import AppError from "../utils/AppError.js";

const fetchPatientProfile = async (patientId) => {
  const baseUrl = process.env.PATIENT_SERVICE_URL;

  if (!baseUrl) {
    throw new AppError("PATIENT_SERVICE_URL is not configured", 500, "PATIENT_SERVICE_NOT_CONFIGURED");
  }

  if (!process.env.INTERNAL_SERVICE_SECRET) {
    throw new AppError("INTERNAL_SERVICE_SECRET is not configured", 500, "INTERNAL_SECRET_MISSING");
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
      throw new AppError(
        payload?.message || "Failed to fetch patient profile",
        response.status,
        payload?.code || "PATIENT_SERVICE_ERROR",
        payload?.details || null
      );
    }

    return payload?.data || payload;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new AppError("Patient service request timed out", 504, "PATIENT_SERVICE_TIMEOUT");
    }

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Patient service is unavailable", 503, "PATIENT_SERVICE_UNAVAILABLE");
  } finally {
    clearTimeout(timeout);
  }
};

const recordReportAccess = async ({ doctorId, patientId, reports }) => {
  const tasks = reports
    .map((report) => report?.url)
    .filter(Boolean)
    .map((reportUrl) =>
      DoctorPatientReport.updateOne(
        { doctorId, patientId, reportUrl },
        { $setOnInsert: { doctorId, patientId, reportUrl } },
        { upsert: true }
      )
    );

  await Promise.all(tasks);
};

export const getPatientReportsForDoctor = async ({ doctorId, patientId }) => {
  const patient = await fetchPatientProfile(patientId);
  const reports = Array.isArray(patient?.reports) ? patient.reports : [];

  await recordReportAccess({ doctorId, patientId, reports });

  return {
    patientId,
    reports
  };
};
