import { renderNotificationEmail } from "./shared.js";

export default (payload) => {
  const recipient = payload?.recipient || {};

  return renderNotificationEmail({
    preheader: "Your Healio Smart Health account has been reactivated.",
    eyebrow: "Account Status Update",
    title: "Welcome back to Healio Smart Health",
    greetingName: recipient.fullName,
    message:
      "Your Healio Smart Health account has been reactivated, and you can now continue using the platform as usual.",
    badge: "Active Again",
    tone: "success",
    highlights: [
      { label: "User", value: recipient.fullName },
      { label: "Email Address", value: recipient.email },
      { label: "Current Status", value: payload?.accountStatus || "ACTIVE" }
    ],
    footerNote: "This is an automated account status notice from Healio Smart Health."
  });
};
