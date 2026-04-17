import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    dose: { type: String, trim: true, default: null },
    frequency: { type: String, trim: true, default: null },
    duration: { type: String, trim: true, default: null },
    notes: { type: String, trim: true, default: null }
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    doctorId: { type: String, required: true, index: true },
    doctorName: { type: String, default: null },
    patientId: { type: String, required: true, index: true },
    patientName: { type: String, default: null },
    appointmentId: { type: String, required: true, index: true },
    diagnosis: { type: String, default: null },
    instructions: { type: String, default: null },
    medicines: { type: [medicineSchema], default: [] },
    issuedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

prescriptionSchema.index(
  { patientId: 1, issuedAt: -1 },
  { name: "idx_prescription_patient_issued" }
);

const Prescription = mongoose.model("Prescription", prescriptionSchema);

export default Prescription;
