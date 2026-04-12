import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/apiResponse.js";
import { getDoctorAvailability, searchDoctors } from "../services/doctor.service.js";

export const handleSearchDoctors = asyncHandler(async (req, res) => {
  const doctors = await searchDoctors(req.query);
  return sendResponse(res, 200, "Doctors fetched", doctors);
});

export const handleDoctorAvailability = asyncHandler(async (req, res) => {
  const availability = await getDoctorAvailability({
    doctorId: req.params.id,
    date: req.query.date,
    mode: req.query.mode
  });

  return sendResponse(res, 200, "Availability fetched", availability);
});
