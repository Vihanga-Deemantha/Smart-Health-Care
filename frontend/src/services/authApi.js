import api from "./axios.js";

export const loginUser = (payload) => api.post("/auth/login", payload);
export const registerPatient = (payload) => api.post("/auth/register/patient", payload);
export const registerDoctor = (payload) => {
  const formData = new FormData();

  formData.append("fullName", payload.fullName);
  formData.append("email", payload.email);
  formData.append("phone", payload.phone);
  formData.append("password", payload.password);
  formData.append("medicalLicenseNumber", payload.medicalLicenseNumber);
  formData.append("specialization", payload.specialization);
  formData.append("yearsOfExperience", String(payload.yearsOfExperience ?? 0));

  if (Array.isArray(payload.verificationLinks) && payload.verificationLinks.length) {
    formData.append("verificationLinks", JSON.stringify(payload.verificationLinks));
  }

  if (Array.isArray(payload.verificationFiles)) {
    payload.verificationFiles.forEach((file) => {
      formData.append("verificationFiles", file);
    });
  }

  return api.post("/auth/register/doctor", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};
export const resubmitDoctorVerification = (payload) => {
  const formData = new FormData();

  if (Array.isArray(payload.verificationLinks) && payload.verificationLinks.length) {
    formData.append("verificationLinks", JSON.stringify(payload.verificationLinks));
  }

  if (Array.isArray(payload.verificationFiles)) {
    payload.verificationFiles.forEach((file) => {
      formData.append("verificationFiles", file);
    });
  }

  return api.post("/auth/doctor/verification/resubmit", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};
export const verifyEmailOtp = (payload) => api.post("/auth/verify-email-otp", payload);
export const resendEmailOtp = (payload) => api.post("/auth/resend-email-otp", payload);
export const forgotPassword = (payload) => api.post("/auth/forgot-password", payload);
export const resetPassword = (payload) => api.post("/auth/reset-password", payload);
export const refreshToken = () => api.post("/auth/refresh-token");
export const logoutUser = () => api.post("/auth/logout");
export const getMe = () => api.get("/auth/me");
