import AuditLog from "../models/AuditLog.js";

export const createAuditLog = async ({ entityType, entityId, action, actorId, actorRole, appointmentId, oldValue, newValue, metadata }) => {
  await AuditLog.create({
    entityType,
    entityId,
    action,
    actorId,
    actorRole,
    appointmentId,
    oldValue,
    newValue,
    metadata
  });
};
