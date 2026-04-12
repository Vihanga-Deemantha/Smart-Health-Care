import mongoose from "mongoose";

const timeOffSchema = new mongoose.Schema(
  {
    doctorId: { type: String, required: true, index: true },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true, index: true },
    reason: { type: String, trim: true, maxlength: 500 },
    approvedBy: { type: String, default: null },
    active: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

timeOffSchema.index({ doctorId: 1, startTime: 1, endTime: 1 }, { name: "idx_timeoff_doctor_window" });

const TimeOff = mongoose.model("TimeOff", timeOffSchema);

export default TimeOff;
