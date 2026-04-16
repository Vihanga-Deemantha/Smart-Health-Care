import { renderNotificationEmail } from "./shared.js";

export default (payload) => {
  const doctor = payload?.doctor || {};

  return renderNotificationEmail({
    preheader: "Your doctor profile needs changes before approval.",
    eyebrow: "Doctor Verification",
    title: "Your profile needs an update",
    greetingName: doctor.fullName,
    message:
      "Your doctor profile was reviewed, but we still need a few updates before approval. Please review the feedback below and resubmit the required details.",
    badge: "Action Needed",
    tone: "warning",
    highlights: [
      { label: "Doctor Name", value: doctor.fullName },
      { label: "Specialization", value: doctor.specialization },
      { label: "Email Address", value: doctor.email },
      { label: "Profile Status", value: "Changes requested" },
      { label: "Review Note", value: payload?.reason }
    ],
    footerNote: "This is an automated verification update from Healio Smart Health."
  });
};
