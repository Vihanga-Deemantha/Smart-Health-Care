import userRegistered from "./user.registered.js";
import doctorApproved from "./doctor.approved.js";
import doctorRejected from "./doctor.rejected.js";
import appointmentBooked from "./appointment.booked.js";
import appointmentConfirmed from "./appointment.confirmed.js";
import appointmentCancelled from "./appointment.cancelled.js";
import paymentSuccess from "./payment.success.js";
import prescriptionIssued from "./prescription.issued.js";

const templates = {
  "notification.user.registered": userRegistered,
  "notification.doctor.approved": doctorApproved,
  "notification.doctor.rejected": doctorRejected,
  "notification.appointment.booked": appointmentBooked,
  "notification.appointment.confirmed": appointmentConfirmed,
  "notification.appointment.cancelled": appointmentCancelled,
  "notification.payment.success": paymentSuccess,
  "notification.prescription.issued": prescriptionIssued
};

export const getEmailTemplate = (event, payload) => {
  const template = templates[event];
  return template ? template(payload) : null;
};
