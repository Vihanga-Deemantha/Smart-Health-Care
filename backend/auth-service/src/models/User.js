import mongoose from "mongoose";

const verificationDocumentSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    publicId: {
      type: String,
      default: null
    },
    mimeType: {
      type: String,
      default: null
    },
    size: {
      type: Number,
      default: null
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

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
    identityType: {
      type: String,
      enum: ["NIC", "PASSPORT", null],
      default: null
    },
    nic: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      default: undefined
    },
    passportNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      default: undefined
    },
    nationality: {
      type: String,
      trim: true,
      default: null
    },
    doctorVerificationStatus: {
      type: String,
      enum: ["NOT_REQUIRED", "PENDING", "APPROVED", "CHANGES_REQUESTED", "REJECTED"],
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
    verificationDocuments: {
      type: [verificationDocumentSchema],
      default: []
    },
    verificationLinks: {
      type: [{ type: String, trim: true }],
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
    accountStatusChangedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    accountStatusChangedAt: {
      type: Date,
      default: null
    },
    accountStatusReason: {
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
