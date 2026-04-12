import api from "../services/axios.js";

export const fetchPatientProfile = () => api.get("/patients/profile");
export const updatePatientProfile = (payload) => api.put("/patients/profile", payload);

export const uploadPatientReport = (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post("/patients/reports", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};

export const fetchPatientReports = () => api.get("/patients/reports");
export const fetchPatientHistory = (params) => api.get("/patients/history", { params });
export const fetchPatientPrescriptions = (params) => api.get("/patients/prescriptions", { params });
export const fetchUpcomingAppointments = (params) =>
  api.get("/appointments", {
    params: {
      from: new Date().toISOString(),
      limit: 5,
      ...params
    }
  });
