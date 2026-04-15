import { renderNotificationEmail } from "./shared.js";

export default (payload) => {
  const doctor = payload?.doctor || {};

  return renderNotificationEmail({
    preheader: "Your doctor profile has been approved.",
    eyebrow: "Doctor Verification",
    title: "You are approved to practice on Healio Smart Health",
    greetingName: doctor.fullName,
    message:
      "Great news. Your doctor profile has been reviewed and approved. You can now receive appointments and continue setting up your availability.",
    badge: "Approved",
    tone: "success",
    highlights: [
      { label: "Doctor Name", value: doctor.fullName },
      { label: "Specialization", value: doctor.specialization },
      { label: "Email Address", value: doctor.email },
      { label: "Profile Status", value: "Approved" }
    ],
    footerNote: "This is an automated verification update from Healio Smart Health."
  });
};
