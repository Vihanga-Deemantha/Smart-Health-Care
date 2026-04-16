import { formatDateTime, renderNotificationEmail } from "./shared.js";

export default (payload) => {
  const patient = payload?.patient || {};
  const doctor = payload?.doctor || {};

  return renderNotificationEmail({
    preheader: "Your appointment has been booked",
    eyebrow: "Appointment Update",
    title: "Appointment Booked",
    greetingName: patient.fullName || "there",
    message: "Your appointment has been booked. We will keep you updated on changes.",
    badge: "Booked",
    tone: "info",
    highlights: [
      { label: "Appointment ID", value: payload?.appointmentId },
      { label: "Date & Time", value: formatDateTime(payload?.appointmentDate || payload?.startTime) },
      { label: "Mode", value: payload?.mode || "-" },
      { label: "Doctor", value: doctor.fullName || "-" }
    ],
    footerNote: "Smart Health Platform | Do not reply to this email"
  });
};
