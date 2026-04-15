import mongoose from "mongoose";

const authLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    email: {
      type: String,
      trim: true,
      default: null
    },
    action: {
      type: String,
      enum: [
        "REGISTERED",
        "LOGIN_SUCCESS",
        "LOGIN_FAILED",
        "PROFILE_VIEWED",
        "OTP_SENT",
        "OTP_VERIFIED",
        "PASSWORD_RESET_REQUESTED",
        "PASSWORD_RESET_SUCCESS",
        "DOCTOR_VERIFICATION_RESUBMITTED",
        "DOCTOR_APPROVED",
        "DOCTOR_CHANGES_REQUESTED",
        "ADMIN_CREATED",
        "ADMIN_DELETED",
        "ADMIN_PROFILE_UPDATED",
        "ADMIN_PROFILE_PHOTO_UPDATED",
        "ADMIN_PROFILE_PHOTO_REMOVED",
        "ADMIN_PASSWORD_CHANGED",
        "ACCOUNT_SUSPENDED",
        "ACCOUNT_ACTIVATED"
      ],
      required: true
    },
    ipAddress: {
      type: String,
      default: null
    },
    userAgent: {
      type: String,
      default: null
    },
    metadata: {
      type: Object,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

const AuthLog = mongoose.model("AuthLog", authLogSchema);

export default AuthLog;
