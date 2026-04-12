import axios from "axios";

const client = axios.create({ timeout: 5000 });

export const getPatientProfile = async (patientId) => {
  const baseUrl = process.env.PATIENT_SERVICE_URL;

  if (!baseUrl) {
    return null;
  }

  try {
    const response = await client.get(`${baseUrl}/internal/patients/${patientId}`, {
      headers: {
        "x-internal-service-secret": process.env.INTERNAL_SERVICE_SECRET
      }
    });

    return response.data?.data || null;
  } catch {
    return null;
  }
};
