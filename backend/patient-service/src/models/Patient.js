import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    publicId: { type: String, default: null },
    resourceType: { type: String, default: null },
    mimeType: { type: String, default: null },
    size: { type: Number, default: null },
    uploadDate: { type: Date, default: Date.now }
  },
  { _id: false }
);

const patientSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    email: { type: String, trim: true, default: null },
    fullName: { type: String, trim: true, default: "Patient" },
    dateOfBirth: { type: Date, default: null },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", null],
      default: null
    },
    contactNumber: { type: String, trim: true, default: null },
    address: { type: String, trim: true, default: null },
    allergies: {
      type: [{ type: String, trim: true }],
      default: []
    },
    reports: {
      type: [reportSchema],
      default: []
    },
    medicalNotes: { type: String, trim: true, default: null }
  },
  { timestamps: true }
);

const Patient = mongoose.model("Patient", patientSchema);

export default Patient;
