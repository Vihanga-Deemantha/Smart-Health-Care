import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    appointmentId: { type: String, required: true, unique: true, trim: true },
    channelName: { type: String, required: true, unique: true, trim: true },
    jitsiRoomUrl: { type: String, default: null },
    provider: { type: String, default: "jitsi" },
    patientId: { type: String, required: true },
    doctorId: { type: String, required: true },
    patientJoined: { type: Boolean, default: false },
    doctorJoined: { type: Boolean, default: false },
    patientName: { type: String, default: null },
    doctorName: { type: String, default: null },
    specialty: { type: String, default: null },
    scheduledAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["scheduled", "waiting", "active", "completed", "cancelled"],
      default: "scheduled"
    },
    waitingStartedAt: { type: Date, default: null },
    sessionStartedAt: { type: Date, default: null },
    sessionEndedAt: { type: Date, default: null },
    durationMinutes: { type: Number, default: null },
    sessionOutcome: {
      type: String,
      enum: ["completed", "no_show", "technical_issue"],
      default: null
    },
    notes: { type: String, default: null },
    createdBy: { type: String, default: null }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

sessionSchema.virtual("isJoinable").get(function isJoinable() {
  if (!this.scheduledAt) {
    return false;
  }

  const scheduled = new Date(this.scheduledAt).getTime();
  if (Number.isNaN(scheduled)) {
    return false;
  }

  const now = Date.now();
  const windowStart = scheduled - 10 * 60 * 1000;
  const windowEnd = scheduled + 60 * 60 * 1000;

  return now >= windowStart && now <= windowEnd;
});

const Session = mongoose.model("Session", sessionSchema);

export default Session;
