import axios from "axios";

const client = axios.create({ timeout: 5000 });

export const assignRoom = async ({ hospitalId, startTime, endTime, doctorId }) => {
  const baseUrl = process.env.ROOM_SERVICE_URL;

  if (!baseUrl) {
    return null;
  }

  const response = await client.post(
    `${baseUrl}/internal/rooms/assign`,
    { hospitalId, startTime, endTime, doctorId },
    {
      headers: {
        "x-internal-service-secret": process.env.INTERNAL_SERVICE_SECRET
      }
    }
  );

  return response.data?.data || null;
};
