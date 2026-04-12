import axios from "axios";

const client = axios.create({ timeout: 5000 });

export const createTelemedicineSession = async ({ appointmentId, doctorId, patientId, startTime, endTime }) => {
  const baseUrl = process.env.TELEMEDICINE_SERVICE_URL;

  if (!baseUrl) {
    return null;
  }

  try {
    const response = await client.post(
      `${baseUrl}/internal/sessions`,
      { appointmentId, doctorId, patientId, startTime, endTime },
      {
        headers: {
          "x-internal-service-secret": process.env.INTERNAL_SERVICE_SECRET
        }
      }
    );

    return response.data?.data || null;
  } catch {
    return null;
  }
};
