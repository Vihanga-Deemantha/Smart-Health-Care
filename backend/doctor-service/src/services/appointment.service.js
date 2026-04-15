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

export const respondToAppointment = async ({ appointmentId, action, reason, authorization }) => {
  const baseUrl = process.env.APPOINTMENT_SERVICE_URL;

  if (!baseUrl) {
    throw new AppError("APPOINTMENT_SERVICE_URL is not configured", 500, "APPOINTMENT_SERVICE_NOT_CONFIGURED");
  }

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

export const getTelemedicineSession = async ({ appointmentId, authorization }) => {
  const baseUrl = process.env.APPOINTMENT_SERVICE_URL;

  if (!baseUrl) {
    throw new AppError("APPOINTMENT_SERVICE_URL is not configured", 500, "APPOINTMENT_SERVICE_NOT_CONFIGURED");
  }

  const payload = await requestUpstream({
    url: `${baseUrl}/api/appointments/${appointmentId}`,
    method: "GET",
    authorization
  });

  const appointment = payload?.data?.appointment || payload?.appointment || payload?.data || payload;

  if (!appointment) {
    throw new AppError("Appointment not found", 404, "APPOINTMENT_NOT_FOUND");
  }

  if (appointment.mode !== "TELEMEDICINE") {
    throw new AppError("Appointment is not telemedicine", 409, "APPOINTMENT_NOT_TELEMEDICINE");
  }

  return {
    appointmentId: appointment._id || appointment.id || appointmentId,
    meetingLink: appointment.telemedicine?.meetingLink || null,
    provider: appointment.telemedicine?.provider || null,
    calendarEventId: appointment.telemedicine?.calendarEventId || null,
    startTime: appointment.startTime,
    endTime: appointment.endTime
  };
};
