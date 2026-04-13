import { useCallback, useEffect, useMemo, useState } from "react";
import { motion as Motion } from "framer-motion";
import { Activity, Clock3, ShieldAlert, ShieldCheck, Users } from "lucide-react";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import ErrorState from "../../components/common/ErrorState.jsx";
import AdminChartCard from "../../components/admin/AdminChartCard.jsx";
import RoleDistributionChart from "../../components/admin/RoleDistributionChart.jsx";
import StatsCard from "../../components/admin/StatsCard.jsx";
import UserGrowthChart from "../../components/admin/UserGrowthChart.jsx";
import { getDashboardStats } from "../../services/adminApi.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";

const formatActionLabel = (value) =>
  value
    ?.toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatActionTimestamp = (value) => {
  if (!value) {
    return "No activity yet";
  }

  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  });
};

const getPercent = (value, total) => {
  if (!total) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
};

const STATUS_COLORS = {
  approved: "#27AE60",
  pending: "#F2994A",
  changes_requested: "#56CCF2",
  rejected: "#EB5757"
};

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadStats = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await getDashboardStats();
      setStats(response.data?.data);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to load dashboard stats."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const overviewMetrics = useMemo(
    () => ({
      totalUsers: Number(stats?.totalUsers || 0),
      totalPatients: Number(stats?.totalPatients || 0),
      totalDoctors: Number(stats?.totalDoctors || 0),
      pendingDoctors: Number(stats?.pendingDoctors || 0),
      activeUsers: Number(stats?.activeUsers || 0),
      suspendedUsers: Number(stats?.suspendedUsers || 0)
    }),
    [stats]
  );

  const recentActionMetrics = useMemo(() => {
    const recentActions = stats?.recentActions || [];
    const actionTrendSummary = stats?.adminActionTrend?.summary;
    const summary = recentActions.reduce(
      (accumulator, action) => {
        switch (action.action) {
          case "DOCTOR_APPROVED":
            accumulator.approvals += 1;
            break;
          case "DOCTOR_CHANGES_REQUESTED":
          case "DOCTOR_REJECTED":
            accumulator.changesRequested += 1;
            break;
          case "USER_SUSPENDED":
            accumulator.suspensions += 1;
            break;
          case "USER_ACTIVATED":
            accumulator.activations += 1;
            break;
          default:
            break;
        }

        return accumulator;
      },
      {
        approvals: 0,
        changesRequested: 0,
        suspensions: 0,
        activations: 0
      }
    );

    return {
      approvals: Number(actionTrendSummary?.approvals ?? summary.approvals),
      changesRequested: Number(
        actionTrendSummary?.changesRequested ?? summary.changesRequested
      ),
      suspensions: Number(actionTrendSummary?.suspensions ?? summary.suspensions),
      activations: Number(actionTrendSummary?.activations ?? summary.activations)
    };
  }, [stats]);

  const growthMetrics = useMemo(() => {
    const userGrowth = stats?.userGrowth;

    return {
      rangeDays: Number(userGrowth?.rangeDays || 14),
      totalNewUsers: Number(userGrowth?.totalNewUsers || 0),
      newPatients: Number(userGrowth?.newPatients || 0),
      newDoctors: Number(userGrowth?.newDoctors || 0),
      points: userGrowth?.points || []
    };
  }, [stats]);

  const roleDistribution = useMemo(
    () => (stats?.roleDistribution || []).map((item) => ({ ...item, value: Number(item.value || 0) })),
    [stats]
  );

  const doctorVerificationPipeline = useMemo(
    () =>
      (stats?.doctorVerificationPipeline || []).map((item) => ({
        ...item,
        value: Number(item.value || 0)
      })),
    [stats]
  );

  const recentActions = useMemo(() => (stats?.recentActions || []).slice(0, 4), [stats]);

  const overviewCards = useMemo(
    () => [
      {
        label: "Total users",
        value: overviewMetrics.totalUsers,
        detail: `${overviewMetrics.totalPatients} patients and ${overviewMetrics.totalDoctors} doctors`,
        accent: "linear-gradient(135deg, #2F80ED, #56CCF2)"
      },
      {
        label: "Total patients",
        value: overviewMetrics.totalPatients,
        detail: `${getPercent(overviewMetrics.totalPatients, overviewMetrics.totalUsers)}% of platform users`,
        accent: "linear-gradient(135deg, #56CCF2, #2F80ED)"
      },
      {
        label: "Total doctors",
        value: overviewMetrics.totalDoctors,
        detail: `${getPercent(overviewMetrics.totalDoctors, overviewMetrics.totalUsers)}% of platform users`,
        accent: "linear-gradient(135deg, #27AE60, #56CCF2)"
      },
      {
        label: "Pending reviews",
        value: overviewMetrics.pendingDoctors,
        detail: `${recentActionMetrics.changesRequested} requested for updates recently`,
        accent: "linear-gradient(135deg, #F2994A, #56CCF2)"
      }
    ],
    [overviewMetrics, recentActionMetrics]
  );

  const healthMetrics = useMemo(
    () => [
      {
        label: "Active accounts",
        value: overviewMetrics.activeUsers,
        detail: `${getPercent(overviewMetrics.activeUsers, overviewMetrics.totalUsers)}% account availability`,
        icon: Users,
        color: "#27AE60",
        bg: "#ECF8F1"
      },
      {
        label: "Suspended accounts",
        value: overviewMetrics.suspendedUsers,
        detail: `${recentActionMetrics.suspensions} recent suspensions`,
        icon: ShieldAlert,
        color: "#EB5757",
        bg: "#FDEEEE"
      },
      {
        label: "Pending doctors",
        value: overviewMetrics.pendingDoctors,
        detail: `${getPercent(overviewMetrics.pendingDoctors, overviewMetrics.totalDoctors)}% of doctor accounts`,
        icon: Clock3,
        color: "#F2994A",
        bg: "#FEF3E8"
      },
      {
        label: "Approved recently",
        value: recentActionMetrics.approvals,
        detail: `${recentActionMetrics.activations} activations in the same window`,
        icon: ShieldCheck,
        color: "#2F80ED",
        bg: "#EEF5FF"
      }
    ],
    [overviewMetrics, recentActionMetrics]
  );

  if (loading) {
    return <LoadingSpinner label="Loading admin dashboard" />;
  }

  if (errorMessage && !stats) {
    return (
      <ErrorState
        title="Dashboard is unavailable"
        description={errorMessage}
        onRetry={loadStats}
      />
    );
  }

  if (!stats) {
    return (
      <EmptyState
        title="Dashboard is unavailable"
        description="We could not load the current admin metrics from the gateway."
      />
    );
  }

  return (
    <div className="space-y-6">
      <Motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4 xl:grid-cols-4"
      >
        {overviewCards.map((card) => (
          <StatsCard
            key={card.label}
            label={card.label}
            value={card.value}
            detail={card.detail}
            accent={card.accent}
          />
        ))}
      </Motion.div>

      {errorMessage ? (
        <div className="rounded-[20px] border border-[#F2994A]/30 bg-[#FFF6EC] px-5 py-4 text-sm text-[#8A5B25]">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1.55fr_0.8fr]">
        <Motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <AdminChartCard
            eyebrow="User Growth"
            title="Patients and doctors joining the platform"
            description={`Live registrations across the last ${growthMetrics.rangeDays} days with separate patient and doctor movement.`}
          >
            <div className="mb-5 grid gap-3 md:grid-cols-3">
              {[
                {
                  label: `New users (${growthMetrics.rangeDays}d)`,
                  value: growthMetrics.totalNewUsers,
                  color: "#2F80ED"
                },
                {
                  label: "New patients",
                  value: growthMetrics.newPatients,
                  color: "#56CCF2"
                },
                {
                  label: "New doctors",
                  value: growthMetrics.newDoctors,
                  color: "#27AE60"
                }
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[18px] border border-[#E0E7EF] bg-[#F9FBFF] px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5C708A]">
                      {item.label}
                    </p>
                  </div>
                  <p className="mt-2 text-3xl font-black text-[#0B1F3A]">{item.value}</p>
                </div>
              ))}
            </div>
            <UserGrowthChart data={growthMetrics.points} />
          </AdminChartCard>
        </Motion.section>

        <Motion.aside
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-5"
        >
          <AdminChartCard
            eyebrow="Account Health"
            title="Operational snapshot"
            description="The most important live account and review signals in one compact panel."
          >
            <div className="space-y-3">
              {healthMetrics.map((item) => {
                const IconComponent = item.icon;

                return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-[18px] border border-[#E0E7EF] bg-[#F9FBFF] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: item.bg, color: item.color }}
                      >
                        <IconComponent size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1D2D50]">{item.label}</p>
                        <p className="text-xs text-[#5C708A]">{item.detail}</p>
                      </div>
                    </div>
                    <span className="text-xl font-black text-[#0B1F3A]">{item.value}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-[20px] border border-[#E0E7EF] bg-[#F9FBFF] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5C708A]">
                    Verification pipeline
                  </p>
                  <p className="mt-1 text-sm text-[#5C708A]">
                    Current doctor review distribution
                  </p>
                </div>
                <span className="text-sm font-bold text-[#1D2D50]">
                  {overviewMetrics.totalDoctors} doctors
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {doctorVerificationPipeline.map((item) => (
                  <div key={item.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: STATUS_COLORS[item.key] || "#2F80ED" }}
                        />
                        <span className="font-semibold text-[#1D2D50]">{item.label}</span>
                      </div>
                      <span className="font-bold text-[#0B1F3A]">{item.value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#EAF1F8]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${getPercent(item.value, overviewMetrics.totalDoctors)}%`,
                          backgroundColor: STATUS_COLORS[item.key] || "#2F80ED"
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AdminChartCard>
        </Motion.aside>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <AdminChartCard
            eyebrow="User Mix"
            title="Role distribution"
            description="A clean split of how your registered user base is distributed today."
            metric={overviewMetrics.totalUsers}
            metricLabel="Tracked accounts"
          >
            <RoleDistributionChart data={roleDistribution} />
          </AdminChartCard>
        </Motion.section>

        <Motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
        >
          <AdminChartCard
            eyebrow="Recent Activity"
            title="Latest administrative decisions"
            description="The newest approvals, account updates, and review actions across the platform."
          >
            <div className="grid gap-3 md:grid-cols-3">
              {[
                { label: "Approvals", value: recentActionMetrics.approvals, color: "#27AE60" },
                {
                  label: "Changes requested",
                  value: recentActionMetrics.changesRequested,
                  color: "#F2994A"
                },
                { label: "Suspensions", value: recentActionMetrics.suspensions, color: "#EB5757" }
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[18px] border border-[#E0E7EF] bg-[#F9FBFF] px-4 py-3"
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5C708A]">
                    {item.label}
                  </p>
                  <p className="mt-2 text-3xl font-black" style={{ color: item.color }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-3">
              {recentActions.length ? (
                recentActions.map((action) => (
                  <div
                    key={action._id}
                    className="flex items-start justify-between gap-4 rounded-[18px] border border-[#E0E7EF] bg-[#F9FBFF] px-4 py-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#1D2D50]">
                        {formatActionLabel(action.action)}
                      </p>
                      <p className="mt-1 text-xs text-[#5C708A]">
                        {action.reason || "Administrative activity recorded in the dashboard feed."}
                      </p>
                    </div>
                    <p className="shrink-0 text-xs font-medium text-[#5C708A]">
                      {formatActionTimestamp(action.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No recent actions yet"
                  description="Administrative actions will appear here once moderation activity begins."
                />
              )}
            </div>
          </AdminChartCard>
        </Motion.section>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
