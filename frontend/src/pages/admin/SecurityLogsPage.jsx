import { useCallback, useEffect, useState } from "react";
import SectionHeading from "../../components/common/SectionHeading.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import ErrorState from "../../components/common/ErrorState.jsx";
import SecurityActivityCard from "../../components/admin/SecurityActivityCard.jsx";
import Pagination from "../../components/common/Pagination.jsx";
import { getAdminActions } from "../../services/adminApi.js";
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
      const response = await getAdminActions({ page, limit: 10 });
      setData(response.data?.data);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to load admin activity."));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadActions();
  }, [loadActions]);

  if (loading) {
    return <LoadingSpinner label="Loading security activity" />;
  }

  if (errorMessage && !data?.actions?.length) {
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
        title="Admin action timeline"
        description="Review the latest approval, rejection, suspension, and activation decisions in one place."
      />

      {errorMessage ? (
        <div className="rounded-[24px] border border-amber-400/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
          {errorMessage}
        </div>
      ) : null}

      {data?.actions?.length ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {data.actions.map((action) => (
              <SecurityActivityCard key={action._id} action={action} />
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
          title="No admin actions yet"
          description="Admin actions will appear here once approvals or user status changes start happening."
        />
      )}
    </div>
  );
};

export default SecurityLogsPage;
