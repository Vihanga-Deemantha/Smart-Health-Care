import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    purpose: {
      type: String,
      enum: ["EMAIL_VERIFY", "PASSWORD_RESET"],
      required: true
    },
    otpCode: {
      type: String,
      required: true
    },
    failedAttempts: {
      type: Number,
      default: 0
    },
    blockedUntil: {
      type: Date,
      default: null
    },
    expiresAt: {
      type: Date,
      required: true
    },
    used: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

otpSchema.index({ email: 1, purpose: 1, createdAt: -1 });

const Otp = mongoose.model("Otp", otpSchema);
export default Otp;
