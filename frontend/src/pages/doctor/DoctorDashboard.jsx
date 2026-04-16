import { useCallback, useEffect, useState } from "react";
import {
  fetchDoctorAppointments,
  fetchDoctorTelemedicineSession,
  respondDoctorAppointment
} from "../../api/doctorApi.js";
import AppointmentCard from "../../components/doctor/AppointmentCard.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import ErrorState from "../../components/common/ErrorState.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";

const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Something went wrong.";

const DoctorDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetchDoctorAppointments();
      const payload =
        response.data?.data?.appointments ||
        response.data?.appointments ||
        response.data?.data?.items ||
        response.data?.items ||
        [];
      setAppointments(Array.isArray(payload) ? payload : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const updateAppointment = (appointmentId, updates) => {
    setAppointments((current) =>
      current.map((item) =>
        item._id === appointmentId || item.id === appointmentId ? { ...item, ...updates } : item
      )
    );
  };

  const handleRespond = async (appointment, action) => {
    const appointmentId = appointment?._id || appointment?.id;

    if (!appointmentId) {
      setError("Missing appointment id.");
      return;
    }

    setActionId(appointmentId);
    setActionMessage("");

    try {
      const response = await respondDoctorAppointment(appointmentId, {
        action: String(action).toUpperCase()
      });
      const updated =
        response.data?.data?.appointment || response.data?.appointment || response.data?.data;
      const nextStatus = action === "accept" ? "CONFIRMED" : "CANCELLED";

      if (updated && (updated._id || updated.id)) {
        updateAppointment(updated._id || updated.id, updated);
      } else {
        updateAppointment(appointmentId, { status: nextStatus });
      }

      setActionMessage(
        action === "accept" ? "Appointment accepted successfully." : "Appointment rejected."
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionId("");
    }
  };

  const handleJoinCall = async (appointment) => {
    const appointmentId = appointment?._id || appointment?.id;

    if (!appointmentId) {
      setError("Missing appointment id.");
      return;
    }

    setActionId(appointmentId);
    setActionMessage("");

    try {
      const response = await fetchDoctorTelemedicineSession(appointmentId);
      const payload = response.data?.data || response.data;
      const roomUrl =
        payload?.roomUrl ||
        payload?.session?.roomUrl ||
        payload?.session?.meetingLink ||
        payload?.meetingLink;

      if (!roomUrl) {
        throw new Error("Room URL is not available for this session.");
      }

      window.open(roomUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionId("");
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-10">
        <LoadingSpinner label="Loading appointments..." />
      </div>
    );
  }

  if (error) {
    return <ErrorState description={error} onRetry={fetchAppointments} />;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Appointments</h2>
            <p className="text-sm text-slate-400">
              Review upcoming visits and respond to booking requests.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchAppointments}
            className="rounded-xl border border-[#01696f]/40 bg-[#01696f]/10 px-4 py-2 text-sm font-semibold text-[#7be0e6] transition hover:bg-[#01696f]/20"
          >
            Refresh
          </button>
        </div>
      </div>

      {actionMessage ? (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {actionMessage}
        </div>
      ) : null}

      {appointments.length === 0 ? (
        <EmptyState
          title="No appointments yet"
          description="Once patients book a session, your upcoming appointments will appear here."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {appointments.map((appointment) => (
            <AppointmentCard
              key={appointment._id || appointment.id}
              appointment={appointment}
              onAccept={(item) => handleRespond(item, "accept")}
              onReject={(item) => handleRespond(item, "reject")}
              onJoinCall={handleJoinCall}
              busy={actionId === (appointment._id || appointment.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
