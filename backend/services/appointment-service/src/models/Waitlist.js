import mongoose from "mongoose";

const waitlistSchema = new mongoose.Schema(
  {
    doctorId: { type: String, required: true, index: true },
    patientId: { type: String, required: true, index: true },
    mode: { type: String, enum: ["IN_PERSON", "TELEMEDICINE"], required: true, index: true },
    preferredFrom: { type: Date, required: true },
    preferredTo: { type: Date, required: true },
    status: { type: String, enum: ["ACTIVE", "PROMOTED", "EXPIRED", "CANCELLED"], default: "ACTIVE", index: true },
    promotedAppointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", default: null },
    priority: { type: Number, default: 0 }
  },
  { timestamps: true }
);

waitlistSchema.index({ doctorId: 1, status: 1, preferredFrom: 1 }, { name: "idx_waitlist_doctor_status" });
waitlistSchema.index({ patientId: 1, status: 1 }, { name: "idx_waitlist_patient" });

const Waitlist = mongoose.model("Waitlist", waitlistSchema);

export default Waitlist;
