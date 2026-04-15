import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    dose: { type: String, trim: true, default: null },
    duration: { type: String, trim: true, default: null },
    notes: { type: String, trim: true, default: null }
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    doctorId: { type: String, required: true, index: true },
    patientId: { type: String, required: true, index: true },
    appointmentId: { type: String, required: true, index: true },
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
