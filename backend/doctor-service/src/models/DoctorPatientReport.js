import mongoose from "mongoose";

const doctorPatientReportSchema = new mongoose.Schema(
  {
    doctorId: { type: String, required: true, index: true },
    patientId: { type: String, required: true, index: true },
    reportUrl: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

doctorPatientReportSchema.index(
  { doctorId: 1, patientId: 1, reportUrl: 1 },
  { unique: true, name: "uniq_doctor_patient_report" }
);

const DoctorPatientReport = mongoose.model("DoctorPatientReport", doctorPatientReportSchema);

export default DoctorPatientReport;
