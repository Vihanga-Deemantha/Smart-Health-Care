import { randomUUID } from "node:crypto";
import { publishEvent } from "./eventPublisher.js";

const buildRecipientPayload = (user) => ({
  userId: String(user._id),
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  role: user.role
});

const buildPatientPayload = (user) => ({
  userId: String(user._id),
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  role: user.role
});

const buildDoctorPayload = (user) => ({
  userId: String(user._id),
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  specialization: user.specialization || null,
  medicalLicenseNumber: user.medicalLicenseNumber || null
});

const buildRoleRecipientPayload = (user) => {
  if (user.role === "DOCTOR") {
    return { doctor: buildDoctorPayload(user) };
  }

  if (user.role === "PATIENT") {
    return { patient: buildPatientPayload(user) };
  }

  return { user: buildRecipientPayload(user) };
};

const buildNotificationPayload = (user, metadata = {}) => ({
  eventId: randomUUID(),
  occurredAt: new Date().toISOString(),
  patient: buildPatientPayload(user),
  recipient: buildRecipientPayload(user),
  ...buildRoleRecipientPayload(user),
  ...metadata
});

export const publishNotificationEventSafely = ({
  routingKey,
  user,
  metadata,
  contextLabel
}) => {
  const payload = buildNotificationPayload(user, metadata);

  try {
    void publishEvent(routingKey, payload).catch((error) => {
      console.error(`Notification event publish failed for ${contextLabel}:`, error.message);
    });
  } catch (error) {
    console.error(`Notification event publish failed for ${contextLabel}:`, error.message);
  }
};
