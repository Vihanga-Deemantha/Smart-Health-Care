import mongoose from "mongoose";
import { ALERT_SEVERITY } from "../utils/constants.js";

const emergencyAlertSchema = new mongoose.Schema(
  {
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true, index: true },
    raisedBy: { type: String, required: true, index: true },
    raisedByRole: { type: String, required: true },
    severity: { type: String, enum: Object.values(ALERT_SEVERITY), required: true, index: true },
    note: { type: String, required: true, trim: true, maxlength: 2000 },
    status: { type: String, enum: ["OPEN", "ACKNOWLEDGED", "RESOLVED"], default: "OPEN", index: true }
  },
  { timestamps: true }
);

emergencyAlertSchema.index({ severity: 1, status: 1, createdAt: -1 }, { name: "idx_alert_ops" });

const EmergencyAlert = mongoose.model("EmergencyAlert", emergencyAlertSchema);

export default EmergencyAlert;
