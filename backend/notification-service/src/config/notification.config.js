export const NOTIFICATION_CONFIG = {
  "notification.user.registered": {
    recipient: "patient",
    channels: ["email", "sms"],
    email: { subject: "Welcome to Smart Health" }
  },
  "notification.doctor.approved": {
    recipient: "doctor",
    channels: ["email", "sms"],
    email: { subject: "Doctor profile approved" }
  },
  "notification.doctor.rejected": {
    recipient: "doctor",
    channels: ["email"],
    email: { subject: "Doctor profile not approved" }
  },
  "notification.appointment.booked": {
    recipient: "patient",
    channels: ["email", "sms", "whatsapp"],
    email: { subject: "Appointment booked" }
  },
  "notification.appointment.confirmed": {
    recipient: "patient",
    channels: ["email", "sms"],
    email: { subject: "Appointment confirmed" }
  },
  "notification.appointment.cancelled": {
    recipient: "patient",
    channels: ["email", "sms"],
    email: { subject: "Appointment cancelled" }
  },
  "notification.payment.success": {
    recipient: "patient",
    channels: ["email", "sms"],
    email: { subject: "Payment successful" }
  },
  "notification.prescription.issued": {
    recipient: "patient",
    channels: ["email", "sms"],
    email: { subject: "Prescription issued" }
  }
};
