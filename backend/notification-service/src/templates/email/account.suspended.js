import { renderNotificationEmail } from "./shared.js";

export default (payload) => {
  const recipient = payload?.recipient || {};

  return renderNotificationEmail({
    preheader: "Your Healio Smart Health account has been suspended.",
    eyebrow: "Account Status Update",
    title: "Your account is temporarily suspended",
    greetingName: recipient.fullName,
    message:
      "Your Healio Smart Health account is currently suspended. If you believe this was unexpected or you need more details, please contact support for assistance.",
    badge: "Suspended",
    tone: "danger",
    highlights: [
      { label: "User", value: recipient.fullName },
      { label: "Email Address", value: recipient.email },
      { label: "Current Status", value: payload?.accountStatus || "SUSPENDED" },
      { label: "Reason", value: payload?.reason }
    ],
    footerNote: "This is an automated account status notice from Healio Smart Health."
  });
};
