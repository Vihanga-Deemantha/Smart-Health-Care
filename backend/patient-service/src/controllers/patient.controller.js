import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/apiResponse.js";
import {
  addPatientReport,
  deletePatientReport,
  getPatientForInternalService,
  getPatientHistory,
  getPatientPrescriptions,
  getPatientProfile,
  getPatientReports,
  updatePatientProfile
} from "../services/patient.service.js";

export const handleGetProfile = asyncHandler(async (req, res) => {
  const profile = await getPatientProfile(req.user);
  return sendResponse(res, 200, "Patient profile fetched", profile);
});

export const handleUpdateProfile = asyncHandler(async (req, res) => {
  const profile = await updatePatientProfile(req.user, req.body);
  return sendResponse(res, 200, "Patient profile updated", profile);
});

export const handleUploadReport = asyncHandler(async (req, res) => {
  const report = await addPatientReport(req.user, req.file);
  return sendResponse(res, 201, "Report uploaded successfully", report);
});

export const handleGetReports = asyncHandler(async (req, res) => {
  const reports = await getPatientReports(req.user);
  return sendResponse(res, 200, "Patient reports fetched", reports);
});

export const handleDeleteReport = asyncHandler(async (req, res) => {
  const report = await deletePatientReport(req.user, {
    publicId: req.body?.publicId,
    url: req.body?.url
  });
  return sendResponse(res, 200, "Report deleted successfully", report);
});

export const handleGetHistory = asyncHandler(async (req, res) => {
  const history = await getPatientHistory({
    user: req.user,
    authorization: req.headers.authorization,
    query: req.query
  });

  return sendResponse(res, 200, "Patient history fetched", history);
});

export const handleGetPrescriptions = asyncHandler(async (req, res) => {
  const prescriptions = await getPatientPrescriptions({
    user: req.user,
    authorization: req.headers.authorization,
    query: req.query
  });

  return sendResponse(res, 200, "Patient prescriptions fetched", prescriptions);
});

export const handleGetPatientInternal = asyncHandler(async (req, res) => {
  const patient = await getPatientForInternalService(req.params.patientId);
  return sendResponse(res, 200, "Internal patient profile fetched", patient);
});
