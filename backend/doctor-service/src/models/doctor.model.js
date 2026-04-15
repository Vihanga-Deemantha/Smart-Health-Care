import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema(
  {
    weekday: {
      type: Number,
      min: 0,
      max: 6,
      required: true
    },
    startHour: {
      type: Number,
      min: 0,
      max: 23,
      required: true
    },
    endHour: {
      type: Number,
      min: 1,
      max: 24,
      required: true
    },
    slotDurationMinutes: {
      type: Number,
      min: 5,
      max: 120,
      default: 30
    },
    mode: {
      type: String,
      enum: ["IN_PERSON", "TELEMEDICINE"],
      default: "IN_PERSON"
    },
    bufferMinutes: {
      type: Number,
      min: 0,
      max: 60,
      default: 0
    },
    timezone: {
      type: String,
      trim: true,
      default: "UTC"
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  { _id: false }
);

const qualificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    institution: {
      type: String,
      trim: true,
      default: null
    },
    year: {
      type: Number,
      min: 1900,
      max: 2100,
      default: null
    },
    documentUrl: {
      type: String,
      trim: true,
      default: null
    },
    notes: {
      type: String,
      trim: true,
      default: null
    }
  },
  { _id: false }
);

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    hospitalId: {
      type: String,
      default: null,
      index: true
    },
    licenseNumber: {
      type: String,
      required: true,
      trim: true
    },
    specialties: {
      type: [String],
      default: []
    },
    availability: {
      type: [availabilitySchema],
      default: []
    },
    contactNumber: {
      type: String,
      trim: true,
      default: null
    },
    address: {
      type: String,
      trim: true,
      default: null
    },
    consultationFee: {
      type: Number,
      min: 0,
      default: 0
    },
    yearsOfExperience: {
      type: Number,
      min: 0,
      default: 0
    },
    qualifications: {
      type: [qualificationSchema],
      default: []
    },
    bio: {
      type: String,
      trim: true
    },
    profilePhoto: {
      type: String,
      trim: true,
      default: null
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    isAvailable: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

const Doctor = mongoose.model("Doctor", doctorSchema);

export default Doctor;
