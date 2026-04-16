import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true, unique: true },
    doctorId: { type: String, required: true, index: true },
    doctorName: { type: String, trim: true, default: null },
    patientId: { type: String, required: true, index: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    review: { type: String, trim: true, maxlength: 2000 },
    isAnonymous: { type: Boolean, default: false },
    moderationStatus: {
      type: String,
      enum: ["VISIBLE", "HIDDEN", "FLAGGED", "DELETED"],
      default: "VISIBLE",
      index: true
    },
    moderatedBy: { type: String, default: null },
    moderatedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

feedbackSchema.index({ doctorId: 1, moderationStatus: 1, createdAt: -1 }, { name: "idx_feedback_public" });

const Feedback = mongoose.model("Feedback", feedbackSchema);

export default Feedback;
