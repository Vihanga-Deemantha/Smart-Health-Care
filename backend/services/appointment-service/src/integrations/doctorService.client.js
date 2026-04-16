import axios from "axios";
import AppError from "../utils/AppError.js";

const client = axios.create({ timeout: 5000 });

export const searchDoctorsFromDoctorService = async (filters) => {
  const baseUrl = process.env.DOCTOR_SERVICE_URL;

  if (!baseUrl) {
    return [];
  }

  try {
    const response = await client.get(`${baseUrl}/internal/doctors`, {
      params: filters,
      headers: {
        "x-internal-service-secret": process.env.INTERNAL_SERVICE_SECRET
      }
    });

    return response.data?.data || [];
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }

    throw new AppError("Failed to fetch doctors from doctor-service", 503, "DOCTOR_SERVICE_UNAVAILABLE");
  }
};

export const getDoctorProfile = async (doctorId) => {
  const baseUrl = process.env.DOCTOR_SERVICE_URL;

  if (!baseUrl) {
    return null;
  }

  try {
    const response = await client.get(`${baseUrl}/internal/doctors/${doctorId}`, {
      headers: {
        "x-internal-service-secret": process.env.INTERNAL_SERVICE_SECRET
      }
    });

    return response.data?.data || null;
  } catch {
    return null;
  }
};

export const getDoctorAvailabilitySchedule = async (doctorId) => {
  const baseUrl = process.env.DOCTOR_SERVICE_URL;

  if (!baseUrl) {
    return null;
  }

  try {
    const response = await client.get(`${baseUrl}/internal/availability/${doctorId}`, {
      headers: {
        "x-internal-service-secret": process.env.INTERNAL_SERVICE_SECRET
      }
    });

    return response.data?.data?.availability || response.data?.availability || response.data?.data || null;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }

    throw new AppError(
      "Failed to fetch doctor availability from doctor-service",
      503,
      "DOCTOR_SERVICE_UNAVAILABLE"
    );
  }
};
