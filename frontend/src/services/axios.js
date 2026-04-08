import axios from "axios";
import {
  clearAccessToken,
  clearSessionHint,
  getAccessToken,
  hasSessionHint,
  setAccessToken,
  setSessionHint
} from "../utils/token.js";
import { emitAuthExpired } from "../utils/authEvents.js";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true
});

const shouldSkipRefresh = (url = "") =>
  [
    "/auth/login",
    "/auth/register/patient",
    "/auth/register/doctor",
    "/auth/verify-email-otp",
    "/auth/resend-email-otp",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/refresh-token"
  ].some((path) => url.includes(path));

api.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      !error.response ||
      error.response.status !== 401 ||
      originalRequest?._retry ||
      shouldSkipRefresh(originalRequest?.url) ||
      !hasSessionHint()
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshPromise =
        refreshPromise ||
        axios
          .post(
            `${api.defaults.baseURL}/auth/refresh-token`,
            {},
            { withCredentials: true }
          )
          .then((response) => {
            const nextToken = response.data?.data?.accessToken;
            if (nextToken) {
              setAccessToken(nextToken);
              setSessionHint();
            }
            return nextToken;
          })
          .finally(() => {
            refreshPromise = null;
          });

      const refreshedToken = await refreshPromise;

      if (refreshedToken) {
        originalRequest.headers.Authorization = `Bearer ${refreshedToken}`;
      }

      return api(originalRequest);
    } catch (refreshError) {
      clearAccessToken();
      clearSessionHint();
      emitAuthExpired();
      return Promise.reject(refreshError);
    }
  }
);

export default api;
