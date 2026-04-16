import { formatDateTime, renderNotificationEmail } from "./shared.js";

export default (payload) => {
  const patient = payload?.patient || {};
  const doctor = payload?.doctor || {};

  return renderNotificationEmail({
    preheader: "Your appointment was rejected",
    eyebrow: "Appointment Update",
    title: "Appointment Rejected",
    greetingName: patient.fullName || "there",
    message: "Your appointment was rejected by the doctor. You can book another time that works for you.",
    badge: "Rejected",
    tone: "danger",
    highlights: [
      { label: "Appointment ID", value: payload?.appointmentId },
      { label: "Date & Time", value: formatDateTime(payload?.appointmentDate || payload?.startTime) },
      { label: "Mode", value: payload?.mode || "-" },
      { label: "Doctor", value: doctor.fullName || "-" },
      { label: "Reason", value: payload?.reason || "-" }
    ],
    footerNote: "Smart Health Platform | Do not reply to this email"
  });
};
