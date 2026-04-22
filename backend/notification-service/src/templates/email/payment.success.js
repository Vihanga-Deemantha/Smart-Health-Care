import { renderNotificationEmail } from "./shared.js";

export default (payload) => {
  const patient = payload?.patient || {};

  return renderNotificationEmail({
    preheader: "Your payment has been received",
    eyebrow: "Payment Update",
    title: "Payment Successful",
    greetingName: patient.fullName || "there",
    message: "We have received your payment successfully. Thank you.",
    badge: "Paid",
    tone: "success",
    highlights: [
      { label: "Appointment ID", value: payload?.appointmentId },
      { label: "Payment ID", value: payload?.paymentId || "-" },
      { label: "Amount", value: payload?.amount || "-" },
      { label: "Currency", value: payload?.currency || "-" }
    ],
    footerNote: "Smart Health Platform | Do not reply to this email"
  });
};
