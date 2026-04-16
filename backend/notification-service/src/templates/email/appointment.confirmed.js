import { formatDateTime, renderNotificationEmail } from "./shared.js";

export default (payload) => {
  const patient = payload?.patient || {};
  const doctor = payload?.doctor || {};

  return renderNotificationEmail({
    preheader: "Your appointment is confirmed",
    eyebrow: "Appointment Update",
    title: "Appointment Confirmed",
    greetingName: patient.fullName || "there",
    message: "Your appointment is confirmed. Please arrive a few minutes early.",
    badge: "Confirmed",
    tone: "success",
    highlights: [
      { label: "Appointment ID", value: payload?.appointmentId },
      { label: "Date & Time", value: formatDateTime(payload?.appointmentDate || payload?.startTime) },
      { label: "Mode", value: payload?.mode || "-" },
      { label: "Doctor", value: doctor.fullName || "-" }
    ],
    footerNote: "Smart Health Platform | Do not reply to this email"
  });
};
