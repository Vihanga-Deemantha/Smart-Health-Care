const firstName = (value) => {
  if (!value) {
    return "there";
  }

  const [name] = String(value).trim().split(/\s+/);
  return name || "there";
};

const shortId = (value) => {
  if (!value) {
    return "";
  }

  const raw = String(value);
  return raw.length > 6 ? raw.slice(-6) : raw;
};

const formatDate = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-GB");
};

const templates = {
  "notification.user.registered": (payload) => {
    const patient = payload?.patient || {};
    return `Smart Health: Welcome ${firstName(patient.fullName)}. ID ${shortId(patient.userId)}.`;
  },
  "notification.doctor.approved": (payload) => {
    const doctor = payload?.doctor || {};
    return `Smart Health: Dr ${firstName(doctor.fullName)}, your profile is approved.`;
  },
  "notification.doctor.rejected": (payload) => {
    const doctor = payload?.doctor || {};
    return `Smart Health: Dr ${firstName(doctor.fullName)}, your profile was not approved.`;
  },
  "notification.account.suspended": (payload) => {
    const recipient = payload?.recipient || {};
    return `Smart Health: ${firstName(recipient.fullName)}, your account has been suspended. Contact support for details.`;
  },
  "notification.account.reactivated": (payload) => {
    const recipient = payload?.recipient || {};
    return `Smart Health: ${firstName(recipient.fullName)}, your account has been reactivated.`;
  },
  "notification.appointment.booked": (payload) => {
    const date = formatDate(payload?.appointmentDate || payload?.startTime);
    return `Smart Health: Appointment booked on ${date}. ID ${shortId(payload?.appointmentId)}.`;
  },
  "notification.appointment.confirmed": (payload) => {
    const date = formatDate(payload?.appointmentDate || payload?.startTime);
    return `Smart Health: Appointment confirmed for ${date}. ID ${shortId(payload?.appointmentId)}.`;
  },
  "notification.appointment.rejected": (payload) => {
    const date = formatDate(payload?.appointmentDate || payload?.startTime);
    const reason = payload?.reason ? ` Reason: ${payload.reason}.` : "";
    return `Smart Health: Appointment rejected for ${date}. ID ${shortId(payload?.appointmentId)}.${reason}`;
  },
  "notification.appointment.cancelled": (payload) => {
    const date = formatDate(payload?.appointmentDate || payload?.startTime);
    return `Smart Health: Appointment cancelled for ${date}. ID ${shortId(payload?.appointmentId)}.`;
  },
  "notification.payment.success": (payload) => {
    const amount = payload?.amount ? `${payload.amount} ${payload.currency || ""}`.trim() : "payment";
    return `Smart Health: ${amount} received. Appt ${shortId(payload?.appointmentId)}.`;
  },
  "notification.prescription.issued": (payload) => {
    return `Smart Health: Prescription issued. Appt ${shortId(payload?.appointmentId)}.`;
  }
};

export const getSmsTemplate = (event, payload) => {
  const template = templates[event];
  return template ? template(payload) : null;
};
