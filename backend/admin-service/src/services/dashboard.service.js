import AdminAction from "../models/AdminAction.js";
import { fetchDashboardCountsFromAuth } from "./authClient.service.js";
import { buildAdminActionTrend } from "../utils/dashboardAnalytics.js";

export const getDashboardStats = async () => {
  const trendStartDate = new Date();
  trendStartDate.setHours(0, 0, 0, 0);
  trendStartDate.setDate(trendStartDate.getDate() - 13);

  const [counts, recentActions, recentTrendActions] = await Promise.all([
    fetchDashboardCountsFromAuth(),
    AdminAction.find().sort({ createdAt: -1 }).limit(10),
    AdminAction.find({ createdAt: { $gte: trendStartDate } })
      .select("action createdAt")
      .sort({ createdAt: 1 })
  ]);

  return {
    ...counts,
    recentActions,
    adminActionTrend: buildAdminActionTrend(recentTrendActions, 14)
  };
};

