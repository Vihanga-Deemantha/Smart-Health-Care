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

const getAppointmentServiceBaseUrl = () => {
  const baseUrl = process.env.APPOINTMENT_SERVICE_URL;

  if (!baseUrl) {
    throw new AppError("Appointment service URL is not configured", 500, "APPOINTMENT_SERVICE_NOT_CONFIGURED");
  }

  return baseUrl;
};

const buildAuthHeaders = (authorization) => ({
  Authorization: authorization
});

const forwardAppointmentRequest = async ({ method, path, authorization, params, data, errorMessage, errorCode }) => {
  try {
    const response = await client.request({
      method,
      url: `${getAppointmentServiceBaseUrl()}${path}`,
      headers: buildAuthHeaders(authorization),
      params,
      data
    });

    return extractPayloadData(response.data);
  } catch (error) {
    throw new AppError(
      error.response?.data?.message || errorMessage,
      error.response?.status || 503,
      errorCode,
      error.response?.data?.details || null
    );
  }
};

export const fetchAppointmentsFromAppointmentService = async ({ authorization, page = 1, limit = 20, status, from, to }) =>
  forwardAppointmentRequest({
    method: "get",
    path: "/api/appointments",
    authorization,
    params: {
      page,
      limit,
      ...(status ? { status } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {})
    },
    errorMessage: "Unable to fetch appointments",
    errorCode: "APPOINTMENTS_UNAVAILABLE"
  });

export const fetchAppointmentByIdFromAppointmentService = async ({ appointmentId, authorization }) =>
  forwardAppointmentRequest({
    method: "get",
    path: `/api/appointments/${appointmentId}`,
    authorization,
    errorMessage: "Unable to fetch appointment",
    errorCode: "APPOINTMENT_UNAVAILABLE"
  });

export const cancelAppointmentInAppointmentService = async ({ appointmentId, authorization, reason, overridePolicy }) =>
  forwardAppointmentRequest({
    method: "patch",
    path: `/api/appointments/${appointmentId}/cancel`,
    authorization,
    data: {
      reason,
      overridePolicy: Boolean(overridePolicy)
    },
    errorMessage: "Unable to cancel appointment",
    errorCode: "APPOINTMENT_CANCEL_UNAVAILABLE"
  });

export const rescheduleAppointmentInAppointmentService = async ({
  appointmentId,
  authorization,
  newStartTime,
  newEndTime
}) =>
  forwardAppointmentRequest({
    method: "patch",
    path: `/api/appointments/${appointmentId}/reschedule`,
    authorization,
    data: {
      newStartTime,
      newEndTime
    },
    errorMessage: "Unable to reschedule appointment",
    errorCode: "APPOINTMENT_RESCHEDULE_UNAVAILABLE"
  });

export const confirmAppointmentAttendanceInAppointmentService = async ({ appointmentId, authorization }) =>
  forwardAppointmentRequest({
    method: "patch",
    path: `/api/appointments/${appointmentId}/confirm-attendance`,
    authorization,
    errorMessage: "Unable to confirm attendance",
    errorCode: "APPOINTMENT_CONFIRM_UNAVAILABLE"
  });

export const fetchHistoryFromAppointmentService = async ({
  authorization,
  page = 1,
  limit = 20,
  status
}) => {
  return forwardAppointmentRequest({
    method: "get",
    path: "/api/appointments",
    authorization,
    params: {
      page,
      limit,
      to: new Date().toISOString(),
      ...(status ? { status } : {})
    },
    errorMessage: "Unable to fetch appointment history",
    errorCode: "APPOINTMENT_SERVICE_UNAVAILABLE"
  });
};

const normalizePrescriptionList = (payload) => {
  const data = extractPayloadData(payload);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.prescriptions)) {
    return data.prescriptions;
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
