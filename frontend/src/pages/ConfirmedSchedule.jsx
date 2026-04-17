import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ScheduleCard from "../components/appointments/ScheduleCard.jsx";
import AppointmentModal from "../components/appointments/AppointmentModal.jsx";
import Toast from "../components/common/Toast.jsx";
import { groupAppointmentsByDate } from "../utils/groupByDate.js";
import api from "../services/axios.js";

const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Something went wrong.";

const buildFallbackPatient = (patientId, fallback = {}) => ({
  id: fallback?.id || patientId || "",
  fullName: fallback?.fullName || "Patient",
  email: fallback?.email || "Not available",
  phone: fallback?.phone || "Not available",
  profilePhoto: fallback?.profilePhoto || ""
});

const LoadingSkeleton = () => (
  <div
    className="rounded-xl border p-4"
    style={{ borderColor: "#30363d", background: "#161b22" }}
  >
    <div className="flex items-center gap-4">
      <div className="h-10 w-16 animate-pulse rounded" style={{ background: "#21262d" }} />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-1/3 animate-pulse rounded" style={{ background: "#21262d" }} />
        <div className="h-3 w-1/2 animate-pulse rounded" style={{ background: "#21262d" }} />
      </div>
      <div className="h-9 w-24 animate-pulse rounded" style={{ background: "#21262d" }} />
    </div>
  </div>
);

const ConfirmedSchedule = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [completingId, setCompletingId] = useState("");

  const addToast = useCallback((message, type = "success") => {
    setToasts((current) => [
      ...current,
      { id: `${Date.now()}-${Math.random()}`, message, type }
    ]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const extractAppointments = (response) => {
    const payload =
      response?.data?.data?.appointments ||
      response?.data?.appointments ||
      response?.data?.data?.items ||
      response?.data?.items ||
      response?.data?.data ||
      response?.data ||
      [];
    return Array.isArray(payload) ? payload : payload?.items || [];
  };

  const enrichAppointments = useCallback((items) => {
    return items.map((appointment) => {
      const rawPatient = appointment.patient;
      const patientRecord = rawPatient && typeof rawPatient === "object" ? rawPatient : {};
      const patientId =
        appointment.patientId ||
        patientRecord?._id ||
        patientRecord?.id ||
        (typeof rawPatient === "string" ? rawPatient : "");
      const fallbackPatient = {
        id: patientId,
        fullName:
          patientRecord?.fullName ||
          patientRecord?.name ||
          appointment.patientName ||
          appointment.patientFullName ||
          "Patient",
        email: patientRecord?.email,
        phone: patientRecord?.phone || patientRecord?.contactNumber,
        profilePhoto: patientRecord?.profilePhoto
      };
      const patient = buildFallbackPatient(patientId, fallbackPatient);
      const videoUrl = appointment.telemedicine?.meetingLink || appointment.telemedicine?.roomUrl || "";

      return {
        ...appointment,
        patient,
        mode: String(appointment.mode || "IN_PERSON").toUpperCase(),
        videoUrl
      };
    });
  }, []);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/doctors/appointments", {
        params: { status: "CONFIRMED" }
      });

      const confirmedItems = extractAppointments(response);
      const enrichedConfirmed = enrichAppointments(confirmedItems);

      setAppointments(enrichedConfirmed);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [enrichAppointments]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const groups = useMemo(() => groupAppointmentsByDate(appointments), [appointments]);

  const handleJoinCall = async (appointment) => {
    const appointmentId = appointment?._id || appointment?.id;
    if (!appointmentId) {
      addToast("Missing appointment id.", "error");
      return;
    }

    navigate(`/doctor/consultation/${appointmentId}`);
  };

  const handleCompleteAppointment = async (appointment) => {
    const appointmentId = appointment?._id || appointment?.id;
    if (!appointmentId) {
      addToast("Missing appointment id.", "error");
      return;
    }

    setCompletingId(appointmentId);

    try {
      await api.patch(`/appointments/${appointmentId}/complete`, {});

      setAppointments((current) =>
        current.filter((item) => (item._id || item.id) !== appointmentId)
      );
      setSelectedAppointment(null);
      addToast("Appointment marked as completed.", "success");
    } catch (err) {
      addToast(getErrorMessage(err), "error");
    } finally {
      setCompletingId("");
    }
  };

  const canJoinCall = (appointment) => {
    if (appointment?.mode !== "TELEMEDICINE") {
      return false;
    }

    if (!appointment?.startTime) {
      return false;
    }

    const startTime = new Date(appointment.startTime);
    if (Number.isNaN(startTime.getTime())) {
      return false;
    }

    const diff = startTime.getTime() - Date.now();
    return diff >= 0 && diff <= 30 * 60 * 1000;
  };

  const isTodayGroup = (dateKey) => {
    const todayKey = new Date().toISOString().split("T")[0];
    return dateKey === todayKey;
  };

  return (
    <div className="space-y-6" style={{ color: "#e6edf3" }}>
        <div
          className="rounded-2xl border p-6"
          style={{ borderColor: "#30363d", background: "#161b22", borderLeft: "3px solid #3fb950" }}
        >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">My Schedule</h2>
            <p className="text-sm" style={{ color: "#8b949e" }}>
              Your confirmed upcoming appointments
            </p>
          </div>
          <button
            type="button"
            aria-label="Refresh schedule"
            onClick={loadAppointments}
            className="rounded-xl border px-4 py-2 text-sm font-semibold"
            style={{ borderColor: "#00b4c8", color: "#00b4c8" }}
          >
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: "#f85149", color: "#f85149", background: "#3d1a1a" }}
        >
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <LoadingSkeleton key={`schedule-skeleton-${item}`} />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div
          className="rounded-2xl border p-8 text-center"
          style={{ borderColor: "#30363d", background: "#161b22" }}
        >
          <p className="text-sm" style={{ color: "#8b949e" }}>
            No upcoming appointments. Accepted appointments will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => {
            const label = group.label
              ? `${group.label} - ${group.fullDate}`
              : group.fullDate;
            const labelColor = group.label === "TODAY" ? "#d29922" : "#e6edf3";

            return (
              <section key={group.dateKey} className="space-y-3">
                <div
                  className="flex items-center justify-between border-b pb-2"
                  style={{ borderColor: "#21262d" }}
                >
                  <p
                    className="text-[13px] font-semibold uppercase"
                    style={{ color: labelColor, letterSpacing: "1px" }}
                  >
                    {label}
                  </p>
                  <span
                    className="rounded-full border px-3 py-1 text-xs"
                    style={{ borderColor: "#30363d", background: "#21262d" }}
                  >
                    {group.appointments.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {group.appointments.map((appointment) => {
                    const appointmentId = appointment._id || appointment.id;

                    return (
                    <ScheduleCard
                      key={appointmentId}
                      appointment={appointment}
                      isToday={isTodayGroup(group.dateKey)}
                      showJoin={canJoinCall(appointment)}
                      onJoinCall={handleJoinCall}
                      onViewDetails={() => setSelectedAppointment(appointment)}
                    />
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {selectedAppointment ? (
        <AppointmentModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onJoinCall={handleJoinCall}
          primaryActionLabel={
            ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(
              String(selectedAppointment?.status || "").toUpperCase()
            )
              ? null
              : "Mark Completed"
          }
          primaryActionDisabled={
            completingId === (selectedAppointment?._id || selectedAppointment?.id)
          }
          onPrimaryAction={handleCompleteAppointment}
        />
      ) : null}

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default ConfirmedSchedule;
