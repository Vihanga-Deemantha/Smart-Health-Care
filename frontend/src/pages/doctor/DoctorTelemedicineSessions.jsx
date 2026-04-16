import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../services/axios.js";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import Toast from "../../components/common/Toast.jsx";

const statusStyles = {
  scheduled: "border border-sky-400/30 bg-sky-500/10 text-sky-200",
  waiting: "border border-amber-400/30 bg-amber-500/10 text-amber-200",
  active: "border border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  completed: "border border-slate-500/30 bg-slate-600/10 text-slate-200",
  cancelled: "border border-rose-400/30 bg-rose-500/10 text-rose-200"
};

const formatDateTime = (value) => {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
};

const normalizeStatus = (value) => String(value || "").toLowerCase();

const DoctorTelemedicineSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    setToasts((current) => [
      ...current,
      { id: `${Date.now()}-${Math.random()}`, message, type }
    ]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = { page, limit: 10 };
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      const response = await api.get("/sessions/doctor/my-sessions", { params });
      const payload = response.data?.data || response.data;
      const items = payload?.sessions || payload?.items || payload || [];

      setSessions(Array.isArray(items) ? items : []);
      setPages(Number(payload?.pages || 1));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load sessions.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const statusOptions = useMemo(
    () => ["all", "scheduled", "waiting", "active", "completed", "cancelled"],
    []
  );

  const handleJoin = async (session) => {
    try {
      const sessionId = session?._id || session?.id || session?.sessionId;
      if (!sessionId) {
        throw new Error("Missing session id.");
      }

      const joinResponse = await api.post(`/sessions/${sessionId}/join`, {});
      const joinPayload = joinResponse.data?.data || joinResponse.data;
      if (joinPayload?.warning) {
        addToast(joinPayload.warning, "error");
      }
      const roomUrl =
        joinPayload?.jitsiRoomUrl ||
        joinPayload?.roomUrl ||
        joinPayload?.meetingLink ||
        session?.jitsiRoomUrl ||
        session?.roomUrl ||
        "";

      if (!roomUrl) {
        throw new Error("Room URL is not available.");
      }

      window.open(roomUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      addToast(err?.response?.data?.message || err?.message || "Failed to join session.", "error");
    }
  };

  const canJoin = (session) =>
    Boolean(
      session?.isJoinable &&
        !["completed", "cancelled"].includes(normalizeStatus(session?.status))
    );

  return (
    <div className="space-y-6" style={{ color: "#e6edf3" }}>
      <div
        className="rounded-2xl border p-6"
        style={{ borderColor: "#30363d", background: "#161b22" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Telemedicine Sessions</h2>
            <p className="text-sm" style={{ color: "#8b949e" }}>
              Live and upcoming video consultations
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "#30363d", background: "#0d1117", color: "#e6edf3" }}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All statuses" : option}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={loadSessions}
              className="rounded-lg border px-4 py-2 text-sm font-semibold"
              style={{ borderColor: "#00b4c8", color: "#00b4c8" }}
            >
              Refresh
            </button>
          </div>
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
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-10">
          <LoadingSpinner label="Loading sessions..." />
        </div>
      ) : sessions.length === 0 ? (
        <div
          className="rounded-2xl border p-8 text-center"
          style={{ borderColor: "#30363d", background: "#161b22" }}
        >
          <p className="text-sm" style={{ color: "#8b949e" }}>
            No sessions found for the selected filter.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const status = normalizeStatus(session?.status || "scheduled");
            const badgeStyle =
              statusStyles[status] || "border border-slate-600/40 bg-slate-700/30 text-slate-200";

            return (
              <div
                key={session?._id || session?.id}
                className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Session
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-white">
                      {session?.patientName || "Patient"}
                    </h3>
                    <p className="text-sm text-slate-300">
                      Appointment: {session?.appointmentId || "-"}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeStyle}`}>
                    {status || "scheduled"}
                  </span>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
                  <div>
                    <span className="text-slate-500">Doctor:</span> {session?.doctorName || "Doctor"}
                  </div>
                  <div>
                    <span className="text-slate-500">Scheduled:</span> {formatDateTime(session?.scheduledAt)}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleJoin(session)}
                    disabled={!canJoin(session)}
                    className="rounded-lg px-4 py-2 text-sm font-semibold"
                    style={{
                      background: canJoin(session) ? "#00b4c8" : "#1f2937",
                      color: canJoin(session) ? "#0d1117" : "#9ca3af",
                      cursor: canJoin(session) ? "pointer" : "not-allowed"
                    }}
                  >
                    Join Session
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={page <= 1}
          className="rounded-lg border px-3 py-2 text-sm font-semibold"
          style={{ borderColor: "#30363d", color: page <= 1 ? "#6b7280" : "#e6edf3" }}
        >
          Previous
        </button>
        <p className="text-sm text-slate-400">
          Page {page} of {pages}
        </p>
        <button
          type="button"
          onClick={() => setPage((current) => Math.min(pages, current + 1))}
          disabled={page >= pages}
          className="rounded-lg border px-3 py-2 text-sm font-semibold"
          style={{ borderColor: "#30363d", color: page >= pages ? "#6b7280" : "#e6edf3" }}
        >
          Next
        </button>
      </div>

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default DoctorTelemedicineSessions;
