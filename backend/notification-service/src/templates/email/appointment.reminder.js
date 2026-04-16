import { formatDateTime, renderNotificationEmail } from "./shared.js";

export default (payload) => {
  const patient = payload?.patient || {};

  return renderNotificationEmail({
    preheader: "Your appointment starts soon",
    eyebrow: "Appointment Reminder",
    title: "Upcoming Appointment",
    greetingName: patient.fullName || "there",
    message: "This is a reminder for your upcoming appointment.",
    badge: payload?.type || "Reminder",
    tone: "info",
    highlights: [
      { label: "Appointment ID", value: payload?.appointmentId },
      { label: "Date & Time", value: formatDateTime(payload?.startTime) },
      { label: "Mode", value: payload?.mode || "-" }
    ]
  });
};
