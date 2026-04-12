import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, required: true, index: true },
    action: { type: String, required: true, index: true },
    actorId: { type: String, required: true, index: true },
    actorRole: { type: String, required: true },
    oldValue: { type: mongoose.Schema.Types.Mixed, default: null },
    newValue: { type: mongoose.Schema.Types.Mixed, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

auditLogSchema.index({ action: 1, createdAt: -1 }, { name: "idx_audit_action_time" });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
