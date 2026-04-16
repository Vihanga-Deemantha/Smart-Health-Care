import { formatDateTime, renderNotificationEmail } from "./shared.js";

export default (payload) => {
  const patient = payload?.patient || {};

  return renderNotificationEmail({
    preheader: "Welcome to Healio Smart Health. Your account is ready.",
    eyebrow: "Welcome Aboard",
    title: "Your Healio Smart Health account is ready",
    greetingName: patient.fullName,
    message:
      "Thanks for joining Healio Smart Health. You can now explore doctors, book consultations, and manage your health journey in one place.",
    badge: "Account Active",
    tone: "success",
    highlights: [
      { label: "User ID", value: patient.userId },
      { label: "Email Address", value: patient.email },
      {
        label: "Registered At",
        value: formatDateTime(payload?.registeredAt || payload?.createdAt)
      }
    ],
    footerNote: "This is an automated welcome email from Healio Smart Health."
  });
};
