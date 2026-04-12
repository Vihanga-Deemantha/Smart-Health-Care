import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import SectionHeading from "../../components/common/SectionHeading.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import ErrorState from "../../components/common/ErrorState.jsx";
import PendingDoctorCard from "../../components/admin/PendingDoctorCard.jsx";
import { approveDoctor, getPendingDoctors, rejectDoctor } from "../../services/adminApi.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";

const PendingDoctorsPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await getPendingDoctors();
      setDoctors(response.data?.data?.users || []);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to load pending doctors."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  const handleApprove = async (id) => {
    setUpdatingId(id);
    try {
      await approveDoctor(id);
      toast.success("Doctor approved successfully");
      await loadDoctors();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to approve doctor."));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReject = async (id, reason) => {
    setUpdatingId(id);
    try {
      await rejectDoctor(id, { reason });
      toast.success("Doctor rejected successfully");
      await loadDoctors();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to reject doctor."));
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading pending doctors" />;
  }

  if (errorMessage && !doctors.length) {
    return (
      <ErrorState
        title="Pending doctor queue is unavailable"
        description={errorMessage}
        onRetry={loadDoctors}
      />
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Approvals"
        title="Pending doctor verification queue"
        description="Review submitted doctor profiles and complete approval decisions."
      />

      {errorMessage ? (
        <div className="rounded-[24px] border border-amber-400/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
          {errorMessage}
        </div>
      ) : null}

      {doctors.length ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {doctors.map((doctor) => (
            <PendingDoctorCard
              key={doctor._id}
              doctor={doctor}
              loading={updatingId === doctor._id}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No pending doctors"
          description="All verified doctors have been reviewed or there are no fresh clinical profiles waiting for approval."
        />
      )}
    </div>
  );
};

export default PendingDoctorsPage;
