import api from "./axios.js";

export const getDashboardStats = () => api.get("/admin/dashboard/stats");
export const getPendingDoctors = () => api.get("/admin/doctors/pending");
export const approveDoctor = (id) => api.patch(`/admin/doctors/${id}/approve`);
export const rejectDoctor = (id, payload) => api.patch(`/admin/doctors/${id}/reject`, payload);
export const getUsers = (params) => api.get("/admin/users", { params });
export const updateUserStatus = (id, payload) => api.patch(`/admin/users/${id}/status`, payload);
export const getAdminActions = (params) => api.get("/admin/actions", { params });
