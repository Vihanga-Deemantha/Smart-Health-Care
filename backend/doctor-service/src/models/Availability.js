import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema(
  {
    doctorId: { type: String, required: true, index: true },
    hospitalId: { type: String, default: null, index: true },
    weekday: { type: Number, min: 0, max: 6, required: true },
    startHour: { type: Number, min: 0, max: 23, required: true },
    endHour: { type: Number, min: 1, max: 24, required: true },
    slotDurationMinutes: { type: Number, min: 5, max: 120, default: 30 },
    bufferMinutes: { type: Number, min: 0, max: 60, default: 0 },
    mode: { type: String, enum: ["IN_PERSON", "TELEMEDICINE"], required: true },
    timezone: { type: String, default: "UTC" },
    active: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

availabilitySchema.index(
  { doctorId: 1, weekday: 1, mode: 1, active: 1 },
  { name: "idx_availability_doctor_weekday_mode" }
);

const Availability = mongoose.model("Availability", availabilitySchema);

export default Availability;
