import { formatDateTime, renderNotificationEmail } from "./shared.js";

export default (payload) => {
  const patient = payload?.patient || {};

  return renderNotificationEmail({
    preheader: "Your appointment was cancelled",
    eyebrow: "Appointment Update",
    title: "Appointment Cancelled",
    greetingName: patient.fullName || "there",
    message: "Your appointment has been cancelled. Contact support if you need help rebooking.",
    badge: "Cancelled",
    tone: "warning",
    highlights: [
      { label: "Appointment ID", value: payload?.appointmentId },
      { label: "Date & Time", value: formatDateTime(payload?.appointmentDate || payload?.startTime) },
      { label: "Mode", value: payload?.mode || "-" },
      { label: "Reason", value: payload?.reason || "-" }
    ],
    footerNote: "Smart Health Platform | Do not reply to this email"
  });
};
