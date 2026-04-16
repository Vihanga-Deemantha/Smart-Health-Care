import userRegistered from "./user.registered.js";
import doctorApproved from "./doctor.approved.js";
import doctorRejected from "./doctor.rejected.js";
import accountSuspended from "./account.suspended.js";
import accountReactivated from "./account.reactivated.js";
import appointmentBooked from "./appointment.booked.js";
import appointmentConfirmed from "./appointment.confirmed.js";
import appointmentRejected from "./appointment.rejected.js";
import appointmentCancelled from "./appointment.cancelled.js";
import appointmentReminder from "./appointment.reminder.js";
import waitlistPromoted from "./waitlist.promoted.js";
import paymentSuccess from "./payment.success.js";
import prescriptionIssued from "./prescription.issued.js";

const templates = {
  "notification.user.registered": userRegistered,
  "notification.doctor.approved": doctorApproved,
  "notification.doctor.rejected": doctorRejected,
  "notification.account.suspended": accountSuspended,
  "notification.account.reactivated": accountReactivated,
  "notification.appointment.booked": appointmentBooked,
  "notification.appointment.created": appointmentBooked,
  "notification.appointment.confirmed": appointmentConfirmed,
  "notification.appointment.rejected": appointmentRejected,
  "notification.appointment.cancelled": appointmentCancelled,
  "notification.appointment.reminder": appointmentReminder,
  "notification.waitlist.promoted": waitlistPromoted,
  "notification.payment.success": paymentSuccess,
  "notification.payment.captured": paymentSuccess,
  "notification.prescription.issued": prescriptionIssued
};

export const getEmailTemplate = (event, payload) => {
  const template = templates[event];
  return template ? template(payload) : null;
};
