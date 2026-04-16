import AppError from "../utils/AppError.js";

const requestUpstream = async ({ url, method, authorization, body }) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const headers = {};
    if (authorization) {
      headers.authorization = authorization;
    }
    if (body) {
      headers["content-type"] = "application/json";
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
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
        payload?.message || "Upstream request failed",
        response.status,
        payload?.code || "UPSTREAM_ERROR",
        payload?.details || null
      );
    }

    return payload;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new AppError("Appointment service request timed out", 504, "APPOINTMENT_TIMEOUT");
    }

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Appointment service is unavailable", 503, "APPOINTMENT_UNAVAILABLE");
  } finally {
    clearTimeout(timeout);
  }
};

const getAppointmentServiceBaseUrl = () => {
  const baseUrl = process.env.APPOINTMENT_SERVICE_URL;

  if (!baseUrl) {
    throw new AppError("APPOINTMENT_SERVICE_URL is not configured", 500, "APPOINTMENT_SERVICE_NOT_CONFIGURED");
  }

  return baseUrl;
};

const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, String(value));
    }
  });

  const value = query.toString();
  return value ? `?${value}` : "";
};

export const listDoctorAppointments = async ({ authorization, status, from, to, page, limit }) => {
  const baseUrl = getAppointmentServiceBaseUrl();
  const queryString = buildQueryString({ status, from, to, page, limit });

  return requestUpstream({
    url: `${baseUrl}/api/appointments${queryString}`,
    method: "GET",
    authorization
  });
};

export const getDoctorAppointmentById = async ({ appointmentId, authorization }) => {
  const baseUrl = getAppointmentServiceBaseUrl();

  return requestUpstream({
    url: `${baseUrl}/api/appointments/${appointmentId}`,
    method: "GET",
    authorization
  });
};

export const respondToAppointment = async ({ appointmentId, action, reason, authorization }) => {
  const baseUrl = getAppointmentServiceBaseUrl();

  const normalizedAction = String(action || "").toUpperCase();

  if (normalizedAction === "ACCEPT" || normalizedAction === "REJECT") {
    return requestUpstream({
      url: `${baseUrl}/api/appointments/${appointmentId}/respond`,
      method: "PATCH",
      authorization,
      body: {
        action: normalizedAction,
        reason
      }
    });
  }

  throw new AppError("Invalid appointment action", 400, "INVALID_ACTION");
};

export const cancelDoctorAppointment = async ({ appointmentId, authorization, reason, overridePolicy }) => {
  const baseUrl = getAppointmentServiceBaseUrl();

  return requestUpstream({
    url: `${baseUrl}/api/appointments/${appointmentId}/cancel`,
    method: "PATCH",
    authorization,
    body: {
      reason,
      overridePolicy: Boolean(overridePolicy)
    }
  });
};

export const confirmDoctorAttendance = async ({ appointmentId, authorization }) => {
  const baseUrl = getAppointmentServiceBaseUrl();

  return requestUpstream({
    url: `${baseUrl}/api/appointments/${appointmentId}/confirm-attendance`,
    method: "PATCH",
    authorization
  });
};

export const markDoctorNoShow = async ({ appointmentId, authorization, target = "PATIENT" }) => {
  const baseUrl = getAppointmentServiceBaseUrl();

  return requestUpstream({
    url: `${baseUrl}/api/appointments/${appointmentId}/no-show`,
    method: "PATCH",
    authorization,
    body: { target }
  });
};

export const getTelemedicineSession = async ({ appointmentId, authorization }) => {
  const baseUrl = getAppointmentServiceBaseUrl();

  const payload = await requestUpstream({
    url: `${baseUrl}/api/appointments/${appointmentId}/telemedicine`,
    method: "GET",
    authorization
  });

  const sessionPayload = payload?.data?.session || payload?.session || payload?.data || payload;

  if (!sessionPayload) {
    throw new AppError("Telemedicine session not found", 404, "TELEMEDICINE_SESSION_NOT_FOUND");
  }

  return {
    appointmentId: sessionPayload.appointmentId || appointmentId,
    meetingLink: sessionPayload.meetingLink || sessionPayload.roomUrl || null,
    provider: sessionPayload.provider || null,
    calendarEventId: sessionPayload.calendarEventId || null,
    startTime: sessionPayload.startTime,
    endTime: sessionPayload.endTime,
    roomUrl: sessionPayload.roomUrl || sessionPayload.meetingLink || null
  };
};

export const getDoctorAvailability = async ({ doctorId, date, mode }) => {
  const baseUrl = getAppointmentServiceBaseUrl();
  const queryString = buildQueryString({ date, mode });

  return requestUpstream({
    url: `${baseUrl}/api/doctors/${doctorId}/availability${queryString}`,
    method: "GET"
  });
};
