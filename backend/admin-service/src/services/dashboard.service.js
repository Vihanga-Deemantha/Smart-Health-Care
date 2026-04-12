import AdminAction from "../models/AdminAction.js";
import { fetchDashboardCountsFromAuth } from "./authClient.service.js";

export const getDashboardStats = async () => {
  const counts = await fetchDashboardCountsFromAuth();

  const recentActions = await AdminAction.find().sort({ createdAt: -1 }).limit(10);

  return {
    ...counts,
    recentActions
  };
};

