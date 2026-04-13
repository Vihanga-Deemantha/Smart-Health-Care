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
  if (error instanceof AppError) {
    throw error;
  }

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

export const fetchAdminsFromAuth = async (params, adminUserId) => {
  const data = await requestWithRetry(
    async () =>
      (
        await authClient.get("/admins", {
          params: {
            ...params,
            adminUserId
          }
        })
      ).data,
    2
  );

  return data.data;
};

export const fetchCurrentAdminProfileFromAuth = async (adminUserId) => {
  const data = await requestWithRetry(
    async () =>
      (
        await authClient.get("/admins/me", {
          params: {
            adminUserId
          }
        })
      ).data,
    2
  );

  return data.data.admin;
};

export const fetchAuthLogsFromAuth = async (params) => {
  const data = await requestWithRetry(
    async () => (await authClient.get("/auth-logs", { params })).data,
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

export const updateUserStatusInAuth = async (userId, status, adminUserId, reason) => {
  try {
    const { data } = await authClient.patch(`/users/${userId}/status`, {
      status,
      adminUserId,
      reason
    });
    return data.data.user;
  } catch (error) {
    toUpstreamError(error);
  }
};

export const createAdminInAuth = async (payload, adminUserId) => {
  try {
    const { data } = await authClient.post("/admins", {
      adminUserId,
      ...payload
    });
    return data.data.admin;
  } catch (error) {
    toUpstreamError(error);
  }
};

export const deleteAdminInAuth = async (targetAdminId, adminUserId) => {
  try {
    const { data } = await authClient.delete(`/admins/${targetAdminId}`, {
      data: {
        adminUserId
      }
    });
    return data.data.admin;
  } catch (error) {
    toUpstreamError(error);
  }
};

export const updateCurrentAdminProfileInAuth = async (payload, adminUserId) => {
  try {
    const { data } = await authClient.patch("/admins/me", {
      adminUserId,
      ...payload
    });
    return data.data.admin;
  } catch (error) {
    toUpstreamError(error);
  }
};

const parseFetchPayload = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  const responseText = await response.text();

  if (!contentType.includes("application/json")) {
    throw new AppError("Auth service returned an unexpected response", 502, "AUTH_SERVICE_ERROR");
  }

  try {
    return JSON.parse(responseText);
  } catch {
    throw new AppError("Auth service returned invalid JSON", 502, "AUTH_SERVICE_ERROR");
  }
};

export const uploadCurrentAdminProfilePhotoInAuth = async (req, adminUserId) => {
  try {
    const response = await fetch(
      `${process.env.AUTH_SERVICE_URL}/internal/admin/admins/me/photo`,
      {
        method: "POST",
        headers: {
          "x-internal-service-secret": process.env.INTERNAL_SERVICE_SECRET,
          "x-admin-user-id": adminUserId,
          "content-type": req.headers["content-type"] || ""
        },
        body: req,
        duplex: "half"
      }
    );

    const payload = await parseFetchPayload(response);

    if (!response.ok) {
      throw {
        response: {
          status: response.status,
          data: payload
        }
      };
    }

    return payload.data.admin;
  } catch (error) {
    toUpstreamError(error);
  }
};

export const removeCurrentAdminProfilePhotoInAuth = async (adminUserId) => {
  try {
    const response = await fetch(
      `${process.env.AUTH_SERVICE_URL}/internal/admin/admins/me/photo`,
      {
        method: "DELETE",
        headers: {
          "x-internal-service-secret": process.env.INTERNAL_SERVICE_SECRET,
          "x-admin-user-id": adminUserId
        }
      }
    );

    const payload = await parseFetchPayload(response);

    if (!response.ok) {
      throw {
        response: {
          status: response.status,
          data: payload
        }
      };
    }

    return payload.data.admin;
  } catch (error) {
    toUpstreamError(error);
  }
};

export const changeCurrentAdminPasswordInAuth = async (payload, adminUserId) => {
  try {
    const { data } = await authClient.patch("/admins/me/password", {
      adminUserId,
      ...payload
    });
    return data.data || null;
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
