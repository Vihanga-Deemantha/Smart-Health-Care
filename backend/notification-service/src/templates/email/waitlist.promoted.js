import { formatDateTime, renderNotificationEmail } from "./shared.js";

export default (payload) => {
  const patient = payload?.patient || {};

  return renderNotificationEmail({
    preheader: "A slot is now available for you",
    eyebrow: "Waitlist Update",
    title: "You Have Been Promoted",
    greetingName: patient.fullName || "there",
    message: "A matching appointment slot is now available from the waitlist.",
    badge: "Slot Available",
    tone: "success",
    highlights: [
      { label: "Waitlist ID", value: payload?.waitlistId },
      { label: "Start Time", value: formatDateTime(payload?.startTime) },
      { label: "End Time", value: formatDateTime(payload?.endTime) },
      { label: "Mode", value: payload?.mode || "-" }
    ]
  });
};
