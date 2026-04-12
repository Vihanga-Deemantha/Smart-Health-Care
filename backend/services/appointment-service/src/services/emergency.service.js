import EmergencyAlert from "../models/EmergencyAlert.js";
import EmergencyResource from "../models/EmergencyResource.js";
import { createAuditLog } from "./audit.service.js";
import { publishEvent } from "../events/publishers/eventPublisher.js";

export const createEmergencyAlert = async ({ appointmentId, raisedBy, raisedByRole, severity, note }) => {
  const alert = await EmergencyAlert.create({
    appointmentId,
    raisedBy,
    raisedByRole,
    severity,
    note
  });

  await createAuditLog({
    appointmentId,
    entityType: "EMERGENCY_ALERT",
    entityId: alert._id.toString(),
    action: "EMERGENCY_ALERT_CREATED",
    actorId: raisedBy,
    actorRole: raisedByRole,
    metadata: { severity }
  });

  await publishEvent("emergency.alert.created", {
    alertId: alert._id.toString(),
    appointmentId,
    severity,
    raisedBy,
    raisedByRole
  });

  return alert;
};

export const listEmergencyResources = async ({ category, city, country }) => {
  const query = { active: true };

  if (category) query.category = category;
  if (city) query.city = city;
  if (country) query.country = country;

  return EmergencyResource.find(query).sort({ category: 1, name: 1 }).lean();
};
