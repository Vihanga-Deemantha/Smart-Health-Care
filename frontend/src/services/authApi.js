import api from "./axios.js";

export const loginUser = (payload) => api.post("/auth/login", payload);
export const registerPatient = (payload) => api.post("/auth/register/patient", payload);
export const registerDoctor = (payload) => api.post("/auth/register/doctor", payload);
export const verifyEmailOtp = (payload) => api.post("/auth/verify-email-otp", payload);
export const resendEmailOtp = (payload) => api.post("/auth/resend-email-otp", payload);
export const forgotPassword = (payload) => api.post("/auth/forgot-password", payload);
export const resetPassword = (payload) => api.post("/auth/reset-password", payload);
export const refreshToken = () => api.post("/auth/refresh-token");
export const logoutUser = () => api.post("/auth/logout");
export const getMe = () => api.get("/auth/me");
