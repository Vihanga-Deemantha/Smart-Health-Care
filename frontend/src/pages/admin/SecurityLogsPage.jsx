import { useCallback, useEffect, useMemo, useState } from "react";
import SectionHeading from "../../components/common/SectionHeading.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import ErrorState from "../../components/common/ErrorState.jsx";
import SecurityActivityCard from "../../components/admin/SecurityActivityCard.jsx";
import Pagination from "../../components/common/Pagination.jsx";
import { getSecurityActivity } from "../../services/adminApi.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";

const SecurityLogsPage = () => {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadActions = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await getSecurityActivity({ page, limit: 10 });
      setData(response.data?.data);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to load security activity."));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadActions();
  }, [loadActions]);

  const timelineMetrics = useMemo(() => {
    const events = data?.events || [];

    return [
      {
        label: "Events in view",
        value: events.length,
        detail: "Security timeline items currently loaded into this page"
      },
      {
        label: "Auth events",
        value: events.filter((item) => item.type === "AUTH_LOG").length,
        detail: "Authentication and access events captured in this slice"
      },
      {
        label: "Admin actions",
        value: events.filter((item) => item.type === "ADMIN_ACTION" || item.action).length,
        detail: "Administrative decisions included in the current activity feed"
      }
    ];
  }, [data]);

  if (loading) {
    return <LoadingSpinner label="Loading security activity" />;
  }

  if (errorMessage && !data?.events?.length) {
    return (
      <ErrorState
        title="Security activity is unavailable"
        description={errorMessage}
        onRetry={loadActions}
      />
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Security activity"
        title="System-wide security timeline"
        description="Review authentication events and admin decisions together in a single operational feed."
        tone="dark"
      />

      {data?.events?.length ? (
        <div className="grid gap-4 md:grid-cols-3">
          {timelineMetrics.map((item) => (
            <div
              key={item.label}
              className="rounded-[24px] border border-[#E0E7EF] bg-white px-5 py-4 shadow-[0_10px_30px_rgba(47,128,237,0.08)]"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5C708A]">
                {item.label}
              </p>
              <p className="mt-2 text-3xl font-black text-[#0B1F3A]">{item.value}</p>
              <p className="mt-2 text-sm leading-6 text-[#5C708A]">{item.detail}</p>
            </div>
          ))}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-[24px] border border-amber-400/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
          {errorMessage}
        </div>
      ) : null}

      {data?.events?.length ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {data.events.map((activity) => (
              <SecurityActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
          <Pagination
            page={data.pagination?.page || 1}
            pages={data.pagination?.pages || 1}
            onChange={setPage}
          />
        </>
      ) : (
        <EmptyState
          title="No security activity yet"
          description="Authentication events and admin actions will appear here once users start using the platform."
        />
      )}
    </div>
  );
};

export default SecurityLogsPage;
