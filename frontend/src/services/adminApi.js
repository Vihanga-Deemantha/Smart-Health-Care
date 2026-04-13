import api from "./axios.js";

export const getDashboardStats = () => api.get("/admin/dashboard/stats");
export const getPendingDoctors = () => api.get("/admin/doctors/pending");
export const approveDoctor = (id) => api.patch(`/admin/doctors/${id}/approve`);
export const rejectDoctor = (id, payload) => api.patch(`/admin/doctors/${id}/reject`, payload);
export const getCurrentAdminProfile = () => api.get("/admin/profile");
export const updateCurrentAdminProfile = (payload) => api.patch("/admin/profile", payload);
export const changeCurrentAdminPassword = (payload) => api.patch("/admin/profile/password", payload);
export const uploadCurrentAdminProfilePhoto = (file) => {
  const formData = new FormData();
  formData.append("profilePhoto", file);

  return api.post("/admin/profile/photo", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};
export const removeCurrentAdminProfilePhoto = () => api.delete("/admin/profile/photo");
export const getAdmins = (params) => api.get("/admin/admins", { params });
export const createAdmin = (payload) => api.post("/admin/admins", payload);
export const deleteAdmin = (id) => api.delete(`/admin/admins/${id}`);
export const getUsers = (params) => api.get("/admin/users", { params });
export const updateUserStatus = (id, payload) => api.patch(`/admin/users/${id}/status`, payload);
export const getAdminActions = (params) => api.get("/admin/actions", { params });
export const getSecurityActivity = (params) => api.get("/admin/security/activity", { params });
