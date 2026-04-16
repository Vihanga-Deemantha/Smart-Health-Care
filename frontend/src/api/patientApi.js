import api from "../services/axios.js";

export const fetchPatientProfile = () => api.get("/patients/profile");
export const updatePatientProfile = (payload) => api.put("/patients/profile", payload);

export const uploadPatientReport = (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post("/patients/reports", formData);
};

export const deletePatientReport = ({ publicId, url }) =>
  api.delete("/patients/reports", {
    data: { publicId, url }
  });

export const fetchPatientReports = () => api.get("/patients/reports");
export const fetchPatientHistory = (params) => api.get("/patients/history", { params });
export const fetchPatientPrescriptions = (params) => api.get("/patients/prescriptions", { params });
export const fetchPatientAppointments = (params) =>
  api.get("/patients/appointments", {
    params: {
      ...params
    }
  });

export const fetchPatientAppointment = (appointmentId) => api.get(`/patients/appointments/${appointmentId}`);

export const cancelPatientAppointment = (appointmentId, payload) =>
  api.patch(`/patients/appointments/${appointmentId}/cancel`, payload);

export const reschedulePatientAppointment = (appointmentId, payload) =>
  api.patch(`/patients/appointments/${appointmentId}/reschedule`, payload);

export const confirmPatientAppointmentAttendance = (appointmentId) =>
  api.patch(`/patients/appointments/${appointmentId}/confirm-attendance`);

export const fetchUpcomingAppointments = (params) =>
  fetchPatientAppointments({
    from: new Date().toISOString(),
    limit: 5,
    ...params
  });
