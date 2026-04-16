import { useCallback, useEffect, useState } from "react";
import api from "../api/axios.js";
import PendingCard from "../components/appointments/PendingCard.jsx";
import UpcomingCard from "../components/appointments/UpcomingCard.jsx";
import AppointmentModal from "../components/appointments/AppointmentModal.jsx";
import Toast from "../components/common/Toast.jsx";

const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Something went wrong.";

const normalizeStatus = (value) => (value ? String(value).toUpperCase() : "");

const formatDateTime = (value) => {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  const datePart = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(date);

  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);

  return `${datePart} - ${timePart}`;
};

const sortByDate = (items) =>
  [...items].sort(
    (first, second) =>
      new Date(first.appointmentDate || first.date || 0) -
      new Date(second.appointmentDate || second.date || 0)
  );

const buildFallbackPatient = (patientId) => ({
  id: patientId || "",
  fullName: "Patient",
  email: "Not available",
  phone: "Not available",
  profilePhoto: ""
});

const EmptyState = ({ title, description, icon }) => (
  <div
    className="rounded-2xl border p-6 text-center"
    style={{ borderColor: "#30363d", background: "#161b22" }}
  >
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
      style={{ background: "#0d1117", border: "1px solid #30363d" }}
    >
      {icon}
    </div>
    <h4 className="mt-3 text-base font-semibold" style={{ color: "#e6edf3" }}>
      {title}
    </h4>
    <p className="mt-1 text-sm" style={{ color: "#8b949e" }}>
      {description}
    </p>
  </div>
);

const InboxIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M4 4h16v10h-4l-2 3h-4l-2-3H4V4Z"
      stroke="#8b949e"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M7 2v3M17 2v3M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
      stroke="#8b949e"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LoadingSkeleton = () => (
  <div
    className="rounded-2xl border p-5"
    style={{ borderColor: "#30363d", background: "#161b22" }}
  >
    <div className="h-4 w-40 animate-pulse rounded" style={{ background: "#21262d" }} />
    <div className="mt-4 space-y-3">
      <div className="h-3 w-3/4 animate-pulse rounded" style={{ background: "#21262d" }} />
      <div className="h-3 w-1/2 animate-pulse rounded" style={{ background: "#21262d" }} />
    </div>
    <div className="mt-4 flex gap-3">
      <div className="h-8 w-24 animate-pulse rounded" style={{ background: "#21262d" }} />
      <div className="h-8 w-24 animate-pulse rounded" style={{ background: "#21262d" }} />
    </div>
  </div>
);

const Dashboard = () => {
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [toasts, setToasts] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const addToast = useCallback((message, type = "success") => {
    setToasts((current) => [
      ...current,
      { id: `${Date.now()}-${Math.random()}`, message, type }
    ]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const fetchPatient = useCallback(
    async (patientId) => {
      if (!patientId) {
        return buildFallbackPatient("");
      }

      try {
        const response = await api.get(`/api/patients/${patientId}`);
        const payload = response.data?.data?.patient || response.data?.patient || response.data;
        return {
          id: payload?._id || payload?.id || patientId,
          fullName: payload?.fullName || payload?.name || "Patient",
          email: payload?.email || "Not available",
          phone: payload?.phone || payload?.contactNumber || "Not available",
          profilePhoto: payload?.profilePhoto || ""
        };
      } catch {
        return buildFallbackPatient(patientId);
      }
    },
    []
  );

  const fetchTelemedicineSession = useCallback(
    async (appointmentId) => {
      if (!appointmentId) {
        return null;
      }

      try {
        const response = await api.get(`/api/appointments/${appointmentId}/telemedicine`);
        const payload = response.data?.data || response.data;
        const session = payload?.session || payload;
        const roomUrl = session?.roomUrl || session?.meetingLink || payload?.meetingLink || "";
        return roomUrl ? { roomUrl } : null;
      } catch {
        return null;
      }
    },
    []
  );

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/api/appointments");
      const payload =
        response.data?.data?.items ||
        response.data?.appointments ||
        response.data?.data?.appointments ||
        response.data?.data ||
        response.data ||
        [];
      const appointments = Array.isArray(payload) ? payload : [];

      const enriched = await Promise.all(
        appointments.map(async (appointment) => {
          const status = normalizeStatus(appointment.status);
          const mode = normalizeStatus(appointment.mode) || "IN_PERSON";
          const needsSession = status === "CONFIRMED" && mode === "TELEMEDICINE";

          const [patient, session] = await Promise.all([
            fetchPatient(appointment.patientId),
            needsSession ? fetchTelemedicineSession(appointment._id) : Promise.resolve(null)
          ]);

          const scheduledAt = appointment.startTime || appointment.appointmentDate;

          return {
            ...appointment,
            status,
            mode,
            patient,
            videoUrl: session?.roomUrl || "",
            scheduledAt,
            formattedDateTime: formatDateTime(scheduledAt)
          };
        })
      );

      const pending = enriched.filter(
        (appointment) => normalizeStatus(appointment.status) === "BOOKED"
      );
      const upcoming = enriched.filter(
        (appointment) => normalizeStatus(appointment.status) === "CONFIRMED"
      );

      setPendingAppointments(sortByDate(pending));
      setUpcomingAppointments(sortByDate(upcoming));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [fetchPatient, fetchTelemedicineSession]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const handleAccept = async (appointment) => {
    const appointmentId = appointment?._id;
    if (!appointmentId) {
      addToast("Missing appointment id.", "error");
      return;
    }

    setBusyId(appointmentId);

    try {
      await doctorApi.patch(
        `/api/appointments/${appointmentId}/respond`,
        { status: "CONFIRMED" },
        { headers: getAuthHeaders() }
      );

      const updatedAppointment = { ...appointment, status: "CONFIRMED" };
      setPendingAppointments((current) =>
        current.filter((item) => item._id !== appointmentId)
      );
      setUpcomingAppointments((current) =>
        sortByDate([updatedAppointment, ...current])
      );
      addToast("Appointment accepted successfully", "success");
    } catch (err) {
      addToast(getErrorMessage(err), "error");
    } finally {
      setBusyId("");
    }
  };

  const handleReject = async (appointment, reason) => {
    const appointmentId = appointment?._id;
    if (!appointmentId) {
      addToast("Missing appointment id.", "error");
      return;
    }

    setBusyId(appointmentId);

    try {
      await doctorApi.patch(
        `/api/appointments/${appointmentId}/respond`,
        { status: "REJECTED", reason: reason || "" },
        { headers: getAuthHeaders() }
      );

      setPendingAppointments((current) =>
        current.filter((item) => item._id !== appointmentId)
      );
      addToast("Appointment rejected", "error");
    } catch (err) {
      addToast(getErrorMessage(err), "error");
    } finally {
      setBusyId("");
    }
  };

  const handleJoinCall = (appointment) => {
    if (!appointment?.videoUrl) {
      addToast("Video session is not available.", "error");
      return;
    }

    window.open(appointment.videoUrl, "_blank", "noopener,noreferrer");
  };

  const isJoinable = (appointment) => {
    if (!appointment?.scheduledAt && !appointment?.appointmentDate) {
      return false;
    }

    const dateValue = appointment.scheduledAt || appointment.appointmentDate;
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
      return false;
    }

    const diff = Math.abs(date.getTime() - Date.now());
    return diff <= 30 * 60 * 1000;
  };

  const sectionHeaderStyle = (accentColor) => ({
    borderLeft: `3px solid ${accentColor}`
  });

  return (
    <div style={{ background: "#0d1117", color: "#e6edf3" }}>
      <div className="space-y-6">
        <div
          className="rounded-2xl border p-6"
          style={{ borderColor: "#30363d", background: "#161b22" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Appointments</h2>
              <p className="text-sm" style={{ color: "#8b949e" }}>
                Review upcoming visits and respond to booking requests.
              </p>
            </div>
            <button
              type="button"
              aria-label="Refresh appointments"
              onClick={loadAppointments}
              className="rounded-xl border px-4 py-2 text-sm font-semibold"
              style={{
                borderColor: "#00b4c8",
                color: "#00b4c8",
                background: "rgba(0, 180, 200, 0.08)"
              }}
            >
              Refresh
            </button>
          </div>
        </div>

        {error ? (
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: "#f85149", background: "rgba(248, 81, 73, 0.1)" }}
          >
            <p className="text-sm" style={{ color: "#f85149" }}>
              {error}
            </p>
          </div>
        ) : null}

        <section className="space-y-4">
          <div
            className="flex items-center justify-between rounded-2xl border p-4"
            style={{
              borderColor: "#30363d",
              background: "#161b22",
              ...sectionHeaderStyle("#d29922")
            }}
          >
            <h3 className="text-lg font-semibold">Pending Requests</h3>
            <span
              className="rounded-full border px-3 py-1 text-xs"
              style={{ borderColor: "#30363d", background: "#21262d" }}
            >
              Pending Requests ({pendingAppointments.length})
            </span>
          </div>

          {loading ? (
            <div className="grid gap-3">
              {[0, 1].map((item) => (
                <LoadingSkeleton key={`pending-skeleton-${item}`} />
              ))}
            </div>
          ) : pendingAppointments.length === 0 ? (
            <EmptyState
              title="No pending requests"
              description="New booking requests will appear here."
              icon={<InboxIcon />}
            />
          ) : (
            <div className="grid gap-3">
              {pendingAppointments.map((appointment) => (
                <PendingCard
                  key={appointment._id}
                  appointment={appointment}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  busy={busyId === appointment._id}
                />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div
            className="flex items-center justify-between rounded-2xl border p-4"
            style={{
              borderColor: "#30363d",
              background: "#161b22",
              ...sectionHeaderStyle("#3fb950")
            }}
          >
            <h3 className="text-lg font-semibold">Upcoming Appointments</h3>
            <span
              className="rounded-full border px-3 py-1 text-xs"
              style={{ borderColor: "#30363d", background: "#21262d" }}
            >
              Upcoming Appointments ({upcomingAppointments.length})
            </span>
          </div>

          {loading ? (
            <div className="grid gap-3">
              {[0, 1].map((item) => (
                <LoadingSkeleton key={`upcoming-skeleton-${item}`} />
              ))}
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <EmptyState
              title="No upcoming appointments"
              description="Accepted appointments will appear here."
              icon={<CalendarIcon />}
            />
          ) : (
            <div className="grid gap-3">
              {upcomingAppointments.map((appointment) => (
                <UpcomingCard
                  key={appointment._id}
                  appointment={appointment}
                  canJoin={
                    normalizeStatus(appointment.mode) === "TELEMEDICINE" &&
                    isJoinable(appointment) &&
                    Boolean(appointment.videoUrl)
                  }
                  onJoinCall={handleJoinCall}
                  onViewDetails={() => setSelectedAppointment(appointment)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {selectedAppointment ? (
        <AppointmentModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onJoinCall={handleJoinCall}
        />
      ) : null}

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default Dashboard;
