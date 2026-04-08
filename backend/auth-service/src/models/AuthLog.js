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
        "PASSWORD_RESET_SUCCESS"
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
