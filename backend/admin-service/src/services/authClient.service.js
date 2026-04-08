import axios from "axios";
import AppError from "../utils/AppError.js";

const authClient = axios.create({
  baseURL: `${process.env.AUTH_SERVICE_URL}/internal/admin`,
  timeout: 5000,
  headers: {
    "x-internal-service-secret": process.env.INTERNAL_SERVICE_SECRET
  }
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const toUpstreamError = (error) => {
  if (error.response) {
    throw new AppError(
      error.response.data?.message || "Auth service request failed",
      error.response.status || 502,
      error.response.data?.code || "AUTH_SERVICE_ERROR",
      error.response.data?.details || null
    );
  }

  if (error.code === "ECONNABORTED") {
    throw new AppError(
      "Auth service request timed out",
      504,
      "AUTH_SERVICE_TIMEOUT"
    );
  }

  throw new AppError(
    "Auth service is unavailable",
    503,
    "AUTH_SERVICE_UNAVAILABLE"
  );
};

const requestWithRetry = async (requestFactory, retries = 0) => {
  let attempt = 0;

  while (true) {
    try {
      return await requestFactory();
    } catch (error) {
      const isRetryable =
        !error.response && (error.code === "ECONNABORTED" || error.code === "ECONNRESET");

      if (attempt >= retries || !isRetryable) {
        toUpstreamError(error);
      }

      attempt += 1;
      await delay(300 * attempt);
    }
  }
};

export const fetchUsersFromAuth = async (params) => {
  const data = await requestWithRetry(
    async () => (await authClient.get("/users", { params })).data,
    2
  );
  return data.data;
};

export const fetchPendingDoctorsFromAuth = async () => {
  const data = await requestWithRetry(
    async () => (await authClient.get("/doctors/pending")).data,
    2
  );
  return data.data.users;
};

export const approveDoctorInAuth = async (doctorUserId, adminUserId) => {
  try {
    const { data } = await authClient.patch(`/doctors/${doctorUserId}/approve`, {
      adminUserId
    });
    return data.data.user;
  } catch (error) {
    toUpstreamError(error);
  }
};

export const rejectDoctorInAuth = async (doctorUserId, adminUserId, reason) => {
  try {
    const { data } = await authClient.patch(`/doctors/${doctorUserId}/reject`, {
      adminUserId,
      reason
    });
    return data.data.user;
  } catch (error) {
    toUpstreamError(error);
  }
};

export const updateUserStatusInAuth = async (userId, status) => {
  try {
    const { data } = await authClient.patch(`/users/${userId}/status`, { status });
    return data.data.user;
  } catch (error) {
    toUpstreamError(error);
  }
};

export const fetchDashboardCountsFromAuth = async () => {
  const data = await requestWithRetry(
    async () => (await authClient.get("/dashboard/counts")).data,
    2
  );
  return data.data;
};
