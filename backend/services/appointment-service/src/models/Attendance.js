import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true, unique: true },
    patientConfirmedAt: { type: Date, default: null },
    doctorConfirmedAt: { type: Date, default: null },
    patientConfirmedBy: { type: String, default: null },
    doctorConfirmedBy: { type: String, default: null },
    status: {
      type: String,
      enum: ["PENDING", "PARTIAL", "CONFIRMED"],
      default: "PENDING",
      index: true
    }
  },
  { timestamps: true }
);

attendanceSchema.index({ appointmentId: 1, status: 1 }, { name: "idx_attendance_status" });

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;
