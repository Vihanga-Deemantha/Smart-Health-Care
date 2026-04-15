import Prescription from "../models/Prescription.js";
import AppError from "../utils/AppError.js";

export const createPrescription = async ({ doctorId, patientId, appointmentId, medicines }) => {
  if (!doctorId) {
    throw new AppError("doctorId is required", 400, "VALIDATION_ERROR");
  }

  const prescription = await Prescription.create({
    doctorId,
    patientId,
    appointmentId,
    medicines,
    issuedAt: new Date()
  });

  return prescription;
};

export const listPrescriptionsForPatient = async ({ patientId, limit = 20 }) => {
  const normalizedLimit = Number(limit) || 20;

  return Prescription.find({ patientId })
    .sort({ issuedAt: -1 })
    .limit(normalizedLimit)
    .lean();
};
