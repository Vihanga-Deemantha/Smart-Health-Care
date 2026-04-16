import { formatDateTime, renderNotificationEmail } from "./shared.js";

const resolveName = (value, fallback) => {
  if (!value) {
    return fallback;
  }

  return value;
};

export default (payload) => {
  const patient = payload?.patient || {};
  const doctor = payload?.doctor || {};
  const recipientRole = String(payload?.recipientRole || "").toLowerCase();
  const greetingName =
    recipientRole === "doctor"
      ? resolveName(doctor.fullName, "Doctor")
      : resolveName(patient.fullName, "there");
  const sessionTime =
    payload?.sessionStartedAt ||
    payload?.scheduledAt ||
    payload?.appointmentDate ||
    payload?.startTime;
  const roomUrl =
    payload?.jitsiRoomUrl || payload?.roomUrl || payload?.meetingLink || "-";

  return renderNotificationEmail({
    preheader: "Your telemedicine session is live",
    eyebrow: "Telemedicine",
    title: "Video Session Started",
    greetingName,
    message: "Your video consultation is active. Use the room link below to join.",
    badge: "Live",
    tone: "info",
    highlights: [
      { label: "Appointment ID", value: payload?.appointmentId },
      { label: "Doctor", value: resolveName(doctor.fullName, "-") },
      { label: "Patient", value: resolveName(patient.fullName, "-") },
      { label: "Started At", value: formatDateTime(sessionTime) },
      { label: "Room Link", value: roomUrl }
    ],
    footerNote: "Smart Health Platform | Do not reply to this email"
  });
};
