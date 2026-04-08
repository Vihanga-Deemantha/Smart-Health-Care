import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import SectionHeading from "../../components/common/SectionHeading.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import ErrorState from "../../components/common/ErrorState.jsx";
import StatsCard from "../../components/admin/StatsCard.jsx";
import SecurityActivityCard from "../../components/admin/SecurityActivityCard.jsx";
import { getDashboardStats } from "../../services/adminApi.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";

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
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Overview"
        title="Operational control at a glance"
        description="Track the live shape of the platform, review approval pressure, and stay close to recent admin activity."
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        <StatsCard label="Total users" value={stats.totalUsers} />
        <StatsCard label="Total patients" value={stats.totalPatients} accent="from-blue-400 to-cyan-400" />
        <StatsCard label="Total doctors" value={stats.totalDoctors} accent="from-emerald-400 to-cyan-400" />
        <StatsCard label="Pending doctors" value={stats.pendingDoctors} accent="from-amber-400 to-orange-400" />
        <StatsCard label="Active users" value={stats.activeUsers} accent="from-emerald-400 to-lime-400" />
        <StatsCard label="Suspended users" value={stats.suspendedUsers} accent="from-rose-400 to-orange-400" />
      </motion.div>

      {errorMessage ? (
        <div className="rounded-[24px] border border-amber-400/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
          {errorMessage}
        </div>
      ) : null}

      <section className="space-y-4">
        <SectionHeading
          eyebrow="Recent actions"
          title="Latest admin activity"
          description="A fast-moving view of the most recent administrative events."
        />
        {stats.recentActions?.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {stats.recentActions.map((action) => (
              <SecurityActivityCard key={action._id} action={action} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No recent actions yet"
            description="Admin actions will appear here as approvals, suspensions, and other management events happen."
          />
        )}
      </section>
    </div>
  );
};

export default AdminDashboardPage;
