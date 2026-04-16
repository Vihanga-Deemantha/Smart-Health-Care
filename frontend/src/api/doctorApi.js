import api from "./axios.js";

export const fetchDoctorAppointments = (params) =>
  api.get("/api/doctors/appointments", {
    params: {
      ...params
    }
  });

export const fetchDoctorAppointment = (appointmentId) =>
  api.get(`/api/doctors/appointments/${appointmentId}`);

export const respondDoctorAppointment = (appointmentId, payload) =>
  api.patch(`/api/doctors/appointments/${appointmentId}/respond`, payload);

export const fetchDoctorTelemedicineSession = (appointmentId) =>
  api.get(`/api/doctors/appointments/${appointmentId}/telemedicine`);

export const cancelDoctorAppointment = (appointmentId, payload) =>
  api.patch(`/api/doctors/appointments/${appointmentId}/cancel`, payload);

export const confirmDoctorAppointmentAttendance = (appointmentId) =>
  api.patch(`/api/doctors/appointments/${appointmentId}/confirm-attendance`);

export const markDoctorAppointmentNoShow = (appointmentId, payload) =>
  api.patch(`/api/doctors/appointments/${appointmentId}/no-show`, payload);
