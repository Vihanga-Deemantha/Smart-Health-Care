import mongoose from "mongoose";

const slotHoldSchema = new mongoose.Schema(
  {
    doctorId: { type: String, required: true, index: true },
    patientId: { type: String, required: true, index: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["ACTIVE", "RELEASED", "CONVERTED", "EXPIRED"],
      default: "ACTIVE",
      index: true
    },
    expiresAt: { type: Date, required: true, index: true },
    releasedAt: { type: Date, default: null },
    releaseReason: { type: String, default: null }
  },
  { timestamps: true }
);

slotHoldSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "ttl_slot_hold" });
slotHoldSchema.index({ doctorId: 1, startTime: 1, status: 1 }, { name: "idx_hold_doctor_slot" });
slotHoldSchema.index({ patientId: 1, status: 1, expiresAt: 1 }, { name: "idx_hold_patient_status_expiry" });

const SlotHold = mongoose.model("SlotHold", slotHoldSchema);

export default SlotHold;
