import { useCallback, useEffect, useMemo, useState } from "react";
import ScheduleCard from "../../components/appointments/ScheduleCard.jsx";
import AppointmentModal from "../../components/appointments/AppointmentModal.jsx";
import api from "../../services/axios.js";

const buildFallbackPatient = (patientId, fallback = {}) => ({
  id: fallback?.id || patientId || "",
  fullName: fallback?.fullName || "Patient",
  email: fallback?.email || "Not available",
  phone: fallback?.phone || "Not available",
  profilePhoto: fallback?.profilePhoto || ""
});

const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Something went wrong.";

const toDateInputValue = (value) => {
  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
};

const buildRangeParams = (fromDate, toDate) => {
  const params = {};

  if (fromDate) {
    params.from = new Date(`${fromDate}T00:00:00`).toISOString();
  }

  if (toDate) {
    params.to = new Date(`${toDate}T23:59:59`).toISOString();
  }

  return params;
};

const groupHistoryByDate = (items = []) => {
  const toDateValue = (appointment) =>
    appointment?.appointmentDate || appointment?.startTime || appointment?.scheduledAt || null;
  const parseDate = (value) => {
    if (!value) {
      return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  };

  const groups = {};

  items
    .filter((appointment) => Boolean(parseDate(toDateValue(appointment))))
    .sort((a, b) => {
      const first = parseDate(toDateValue(a));
      const second = parseDate(toDateValue(b));
      return (second?.getTime() || 0) - (first?.getTime() || 0);
    })
    .forEach((appointment) => {
      const date = parseDate(toDateValue(appointment));
      if (!date) {
        return;
      }

      const dateKey = date.toISOString().split("T")[0];
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(appointment);
    });

  return Object.keys(groups)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .map((dateKey) => {
      const date = new Date(dateKey);
      const fullDate = date.toLocaleDateString("en-LK", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      });

      return {
        dateKey,
        label: "",
        fullDate,
        appointments: groups[dateKey]
      };
    });
};

const DoctorCompletedAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [quickRange, setQuickRange] = useState("");

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
      const params = {
        status: "COMPLETED",
        limit: 100,
        ...buildRangeParams(fromDate, toDate)
      };

      const response = await api.get("/doctors/appointments", { params });

      const items = extractAppointments(response);
      const enriched = enrichAppointments(items);
      setAppointments(enriched);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [enrichAppointments, fromDate, toDate]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const filteredAppointments = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return appointments;
    }

    return appointments.filter((appointment) => {
      const patientName = appointment?.patient?.fullName || appointment?.patientName || "";
      const appointmentId = appointment?._id || appointment?.id || "";

      return (
        patientName.toLowerCase().includes(query) ||
        String(appointmentId).toLowerCase().includes(query)
      );
    });
  }, [appointments, search]);

  const groups = useMemo(
    () => groupHistoryByDate(filteredAppointments),
    [filteredAppointments]
  );

  const applyQuickRange = (days) => {
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - days);

    setFromDate(toDateInputValue(from));
    setToDate(toDateInputValue(now));
    setQuickRange(String(days));
  };

  const clearFilters = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
    setQuickRange("");
  };

  return (
    <div className="space-y-6" style={{ color: "#e6edf3" }}>
      <div
        className="rounded-2xl border p-6"
        style={{ borderColor: "#30363d", background: "#161b22", borderLeft: "3px solid #22c55e" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Completed History</h2>
            <p className="text-sm" style={{ color: "#8b949e" }}>
              Search completed appointments and manage prescriptions
            </p>
          </div>
          <button
            type="button"
            aria-label="Refresh completed history"
            onClick={loadAppointments}
            className="rounded-xl border px-4 py-2 text-sm font-semibold"
            style={{ borderColor: "#00b4c8", color: "#00b4c8" }}
          >
            Refresh
          </button>
        </div>
      </div>

      <div
        className="rounded-2xl border p-5"
        style={{ borderColor: "#30363d", background: "#161b22" }}
      >
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Search
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Patient name or appointment ID"
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "#30363d", background: "#0d1117", color: "#e6edf3" }}
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            From date
            <input
              type="date"
              value={fromDate}
              onChange={(event) => {
                setFromDate(event.target.value);
                setQuickRange("");
              }}
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "#30363d", background: "#0d1117", color: "#e6edf3" }}
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            To date
            <input
              type="date"
              value={toDate}
              onChange={(event) => {
                setToDate(event.target.value);
                setQuickRange("");
              }}
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "#30363d", background: "#0d1117", color: "#e6edf3" }}
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => applyQuickRange(days)}
              className="rounded-full border px-3 py-1 text-xs font-semibold"
              style={{
                borderColor: quickRange === String(days) ? "#22c55e" : "#30363d",
                color: quickRange === String(days) ? "#22c55e" : "#e6edf3",
                background: quickRange === String(days) ? "rgba(34, 197, 94, 0.12)" : "#0d1117"
              }}
            >
              Last {days} days
            </button>
          ))}
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-full border px-3 py-1 text-xs font-semibold"
            style={{ borderColor: "#30363d", color: "#9ca3af", background: "#0d1117" }}
          >
            Clear filters
          </button>
          <span className="ml-auto text-xs text-slate-400">
            {filteredAppointments.length} results
          </span>
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
          Loading completed appointments...
        </div>
      ) : groups.length === 0 ? (
        <div
          className="rounded-2xl border p-8 text-center"
          style={{ borderColor: "#30363d", background: "#161b22" }}
        >
          <p className="text-sm" style={{ color: "#8b949e" }}>
            No completed appointments found for the current filters.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => {
            const label = group.label
              ? `${group.label} - ${group.fullDate}`
              : group.fullDate;

            return (
              <section key={group.dateKey} className="space-y-3">
                <div
                  className="flex items-center justify-between border-b pb-2"
                  style={{ borderColor: "#21262d" }}
                >
                  <p
                    className="text-[13px] font-semibold uppercase"
                    style={{ color: "#e6edf3", letterSpacing: "1px" }}
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
                        showJoin={false}
                        isToday={false}
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
        />
      ) : null}

    </div>
  );
};

export default DoctorCompletedAppointments;
