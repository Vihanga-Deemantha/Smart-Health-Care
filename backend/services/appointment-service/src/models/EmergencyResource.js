import mongoose from "mongoose";

const emergencyResourceSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ["HOSPITAL", "AMBULANCE", "HELPLINE", "POLICE", "FIRE"],
      required: true,
      index: true
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, default: null },
    city: { type: String, default: null, index: true },
    country: { type: String, default: null, index: true },
    active: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

emergencyResourceSchema.index({ category: 1, city: 1, active: 1 }, { name: "idx_resource_lookup" });

const EmergencyResource = mongoose.model("EmergencyResource", emergencyResourceSchema);

export default EmergencyResource;
