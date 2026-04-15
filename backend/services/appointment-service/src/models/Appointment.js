import mongoose from "mongoose";
import { APPOINTMENT_STATUS, CONSULTATION_MODE } from "../utils/constants.js";

const appointmentSchema = new mongoose.Schema(
  {
    doctorId: { type: String, required: true, index: true },
    patientId: { type: String, required: true, index: true },
    hospitalId: { type: String, default: null, index: true },
    appointmentDate: { type: String, required: true, index: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    mode: {
      type: String,
      enum: Object.values(CONSULTATION_MODE),
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(APPOINTMENT_STATUS),
      default: APPOINTMENT_STATUS.BOOKED,
      index: true
    },
    reason: { type: String, trim: true, maxlength: 500 },
    telemedicine: {
      meetingLink: { type: String, default: null },
      provider: { type: String, default: null },
      calendarEventId: { type: String, default: null }
    },
    inPerson: {
      roomId: { type: String, default: null },
      roomName: { type: String, default: null },
      floor: { type: String, default: null }
    },
    statusTimestamps: {
      holdAt: Date,
      bookedAt: Date,
      confirmedAt: Date,
      completedAt: Date,
      cancelledAt: Date,
      noShowAt: Date,
      rescheduledAt: Date
    },
    cancellation: {
      cancelledBy: { type: String, default: null },
      cancelledByRole: { type: String, default: null },
      reason: { type: String, default: null },
      policyOverride: { type: Boolean, default: false }
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

appointmentSchema.index({ doctorId: 1, startTime: 1 }, { unique: true, name: "uniq_doctor_start" });
appointmentSchema.index({ patientId: 1, appointmentDate: 1 }, { name: "idx_patient_date" });
appointmentSchema.index({ status: 1, startTime: 1 }, { name: "idx_status_time" });
appointmentSchema.index({ doctorId: 1, status: 1, appointmentDate: 1 }, { name: "idx_doctor_status_date" });

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;
