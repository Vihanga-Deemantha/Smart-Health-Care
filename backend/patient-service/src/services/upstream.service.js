import axios from "axios";
import AppError from "../utils/AppError.js";

const client = axios.create({
  timeout: 7000
});

const extractPayloadData = (payload) => {
  if (payload?.data !== undefined) {
    return payload.data;
  }

  return payload;
};

export const fetchHistoryFromAppointmentService = async ({
  authorization,
  page = 1,
  limit = 20,
  status
}) => {
  const baseUrl = process.env.APPOINTMENT_SERVICE_URL;

  if (!baseUrl) {
    throw new AppError("Appointment service URL is not configured", 500, "APPOINTMENT_SERVICE_NOT_CONFIGURED");
  }

  try {
    const response = await client.get(`${baseUrl}/api/appointments`, {
      headers: {
        Authorization: authorization
      },
      params: {
        page,
        limit,
        to: new Date().toISOString(),
        ...(status ? { status } : {})
      }
    });

    return extractPayloadData(response.data);
  } catch (error) {
    throw new AppError(
      error.response?.data?.message || "Unable to fetch appointment history",
      error.response?.status || 503,
      "APPOINTMENT_SERVICE_UNAVAILABLE",
      error.response?.data?.details || null
    );
  }
};

const normalizePrescriptionList = (payload) => {
  const data = extractPayloadData(payload);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  return [];
};

export const fetchPrescriptionsFromUpstream = async ({ patientId, authorization, limit = 20 }) => {
  const doctorServiceUrl = process.env.DOCTOR_SERVICE_URL;

  if (doctorServiceUrl) {
    try {
      const response = await client.get(`${doctorServiceUrl}/api/prescriptions`, {
        headers: {
          Authorization: authorization
        },
        params: {
          patientId,
          limit
        }
      });

      return {
        source: "doctor-service",
        items: normalizePrescriptionList(response.data)
      };
    } catch {
      // Fallback to appointment metadata when doctor service is unavailable.
    }
  }

  const appointmentServiceUrl = process.env.APPOINTMENT_SERVICE_URL;

  if (!appointmentServiceUrl) {
    return {
      source: "unavailable",
      items: []
    };
  }

  try {
    const response = await client.get(`${appointmentServiceUrl}/api/appointments`, {
      headers: {
        Authorization: authorization
      },
      params: {
        status: "COMPLETED",
        limit
      }
    });

    const appointments = extractPayloadData(response.data)?.items || [];

    const prescriptions = appointments
      .filter((item) => Boolean(item?.metadata?.prescription))
      .map((item) => ({
        appointmentId: item._id,
        doctorId: item.doctorId,
        issuedAt: item.endTime || item.updatedAt || item.createdAt,
        prescription: item.metadata.prescription
      }));

    return {
      source: "appointment-metadata",
      items: prescriptions
    };
  } catch {
    throw new AppError("Unable to fetch prescriptions", 503, "PRESCRIPTIONS_UNAVAILABLE");
  }
};
