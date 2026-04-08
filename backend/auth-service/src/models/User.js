import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["PATIENT", "DOCTOR", "ADMIN"],
      required: true
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    accountStatus: {
      type: String,
      enum: ["PENDING", "ACTIVE", "SUSPENDED", "LOCKED"],
      default: "PENDING"
    },
    doctorVerificationStatus: {
      type: String,
      enum: ["NOT_REQUIRED", "PENDING", "APPROVED", "REJECTED"],
      default: "NOT_REQUIRED"
    },
    medicalLicenseNumber: {
      type: String,
      trim: true,
      default: null
    },
    specialization: {
      type: String,
      trim: true,
      default: null
    },
    yearsOfExperience: {
      type: Number,
      default: 0
    },
    qualificationDocuments: {
      type: [String],
      default: []
    },
    doctorReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    doctorReviewedAt: {
      type: Date,
      default: null
    },
    doctorRejectionReason: {
      type: String,
      default: null
    },
    failedLoginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: {
      type: Date,
      default: null
    },
    lastLoginAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.model("User", userSchema);

export default User;
