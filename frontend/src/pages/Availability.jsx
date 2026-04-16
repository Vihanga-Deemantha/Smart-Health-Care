import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import DayGroup from "../components/availability/DayGroup.jsx";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import { validateSlots } from "../utils/validateSlots.js";

const API_BASE_URL = import.meta.env.VITE_DOCTOR_SERVICE_URL || "http://localhost:5029";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

const createId = () => `slot-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createSlot = (weekday) => ({
  id: createId(),
  weekday,
  startTime: "09:00",
  endTime: "17:00",
  duration: 30,
  mode: "IN_PERSON",
  isActive: true
});

const getAuthHeaders = () => {
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Something went wrong.";

const formatDateInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toDateKey = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return formatDateInput(date);
};

const formatDateDisplay = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date);
};

const CalendarIcon = () => (
  <svg
    width="18"
    height="18"
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

const Availability = () => {
  const [doctorId, setDoctorId] = useState("");
  const [weeklySchedule, setWeeklySchedule] = useState([]);
  const [offDays, setOffDays] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [activeTab, setActiveTab] = useState("schedule");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [removingDate, setRemovingDate] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);
  const [blockDate, setBlockDate] = useState(formatDateInput(new Date()));
  const [blockReason, setBlockReason] = useState("");

  const api = useMemo(() => axios.create({ baseURL: API_BASE_URL }), []);

  const resolveDoctorId = useCallback(async () => {
    const storedUserId = localStorage.getItem("userId");

    if (!storedUserId) {
      return null;
    }

    const response = await api.get("/api/doctors", { headers: getAuthHeaders() });
    const doctors = response.data?.data?.doctors || response.data?.doctors || [];
    const match = doctors.find((doctor) => String(doctor.userId) === String(storedUserId));

    return match?._id || null;
  }, [api]);

  const fetchAvailability = useCallback(async (id) => {
    const response = await api.get(`/api/availability/${id}`, { headers: getAuthHeaders() });
    const availability = response.data?.data?.availability || response.data?.availability || {};

    const schedule = (availability.weeklySchedule || []).map((slot) => ({
      id: slot._id ? String(slot._id) : createId(),
      weekday: slot.weekday,
      startTime: slot.startTime,
      endTime: slot.endTime,
      duration: Number(slot.duration || 30),
      mode: slot.mode || "IN_PERSON",
      isActive: slot.isActive ?? true
    }));

    setWeeklySchedule(schedule);
    setOffDays(availability.offDays || []);
    setBlockedDates(availability.blockedDates || []);
  }, [api]);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      setError("");

      try {
        const id = await resolveDoctorId();

        if (!id) {
          setDoctorId("");
          setWeeklySchedule([]);
          setOffDays([]);
          setBlockedDates([]);
          setError("Doctor profile not found. Please complete your registration.");
          return;
        }

        setDoctorId(id);
        await fetchAvailability(id);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [fetchAvailability, resolveDoctorId]);

  useEffect(() => {
    setError("");
    setSuccess("");
    setValidationErrors([]);
  }, [activeTab]);

  const slotsByDay = useMemo(() => {
    const grouped = DAYS.reduce((acc, day) => {
      acc[day] = [];
      return acc;
    }, {});

    weeklySchedule.forEach((slot) => {
      if (!grouped[slot.weekday]) {
        grouped[slot.weekday] = [];
      }
      grouped[slot.weekday].push(slot);
    });

    Object.values(grouped).forEach((daySlots) => {
      daySlots.sort((first, second) => first.startTime.localeCompare(second.startTime));
    });

    return grouped;
  }, [weeklySchedule]);

  const handleAddSlot = (day) => {
    setWeeklySchedule((current) => [...current, createSlot(day)]);
  };

  const handleChangeSlot = (slotId, updates) => {
    setWeeklySchedule((current) =>
      current.map((slot) => (slot.id === slotId ? { ...slot, ...updates } : slot))
    );
  };

  const handleRemoveSlot = (slotId) => {
    setWeeklySchedule((current) => current.filter((slot) => slot.id !== slotId));
  };

  const handleToggleOff = (day) => {
    setOffDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day]
    );
  };

  const handleSaveSchedule = async () => {
    setError("");
    setSuccess("");

    if (!doctorId) {
      setError("Doctor ID not found. Please login again.");
      return;
    }

    const nextErrors = validateSlots(weeklySchedule);
    setValidationErrors(nextErrors);

    if (nextErrors.length) {
      return;
    }

    setSaving(true);

    try {
      await api.put(
        `/api/availability/${doctorId}`,
        {
          weeklySchedule: weeklySchedule.map(({ id, ...slot }) => ({
            ...slot,
            duration: Number(slot.duration || 30)
          })),
          offDays
        },
        { headers: getAuthHeaders() }
      );

      setSuccess("Availability saved successfully.");
      await fetchAvailability(doctorId);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleBlockDate = async () => {
    setError("");
    setSuccess("");

    if (!doctorId) {
      setError("Doctor ID not found. Please login again.");
      return;
    }

    if (!blockDate) {
      setError("Please select a date to block.");
      return;
    }

    const todayKey = formatDateInput(new Date());
    if (blockDate < todayKey) {
      setError("Cannot block a past date");
      return;
    }

    if (blockedDates.some((entry) => toDateKey(entry.date) === blockDate)) {
      setError("This date is already blocked");
      return;
    }

    if (blockReason.length > 100) {
      setError("Reason must be 100 characters or less");
      return;
    }

    setBlocking(true);

    try {
      const trimmedReason = blockReason.trim();
      const payload = trimmedReason
        ? { date: blockDate, reason: trimmedReason }
        : { date: blockDate };

      const response = await api.post(
        `/api/availability/${doctorId}/blocked-dates`,
        payload,
        { headers: getAuthHeaders() }
      );

      const availability = response.data?.data?.availability || response.data?.availability || {};
      setBlockedDates(availability.blockedDates || []);
      setSuccess("Date blocked successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBlocking(false);
    }
  };

  const handleRemoveBlockedDate = async (dateKey) => {
    setError("");
    setSuccess("");

    if (!doctorId) {
      setError("Doctor ID not found. Please login again.");
      return;
    }

    setRemovingDate(dateKey);

    try {
      const response = await api.delete(
        `/api/availability/${doctorId}/blocked-dates/${dateKey}`,
        { headers: getAuthHeaders() }
      );

      const availability = response.data?.data?.availability || response.data?.availability || {};
      setBlockedDates(availability.blockedDates || []);
      setSuccess("Blocked date removed.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRemovingDate("");
    }
  };

  const tabStyle = (isActive) => ({
    borderBottom: isActive ? "2px solid #00b4c8" : "2px solid transparent",
    color: isActive ? "#00b4c8" : "#8b949e",
    padding: "12px 6px",
    fontWeight: 600,
    background: "transparent"
  });

  const alertBase = {
    borderRadius: "14px",
    padding: "12px 14px",
    fontSize: "14px",
    border: "1px solid"
  };

  return (
    <div style={{ background: "#0d1117", color: "#e6edf3" }}>
      <div className="space-y-6">
        <div
          className="rounded-2xl border p-6"
          style={{
            borderColor: "#30363d",
            background: "linear-gradient(135deg, #161b22, #0d1117)"
          }}
        >
          <h2 className="text-xl font-semibold">Doctor Availability</h2>
          <p className="text-sm" style={{ color: "#8b949e" }}>
            Manage your weekly slots, day-offs, and holidays.
          </p>
        </div>

        <div className="flex gap-6 border-b" style={{ borderColor: "#30363d" }}>
          <button
            type="button"
            onClick={() => setActiveTab("schedule")}
            style={tabStyle(activeTab === "schedule")}
          >
            Weekly Schedule
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("leave")}
            style={tabStyle(activeTab === "leave")}
          >
            Leave & Holidays
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border p-6" style={{ borderColor: "#30363d" }}>
            <LoadingSpinner label="Loading availability..." />
          </div>
        ) : null}

        {validationErrors.length ? (
          <div
            style={{
              ...alertBase,
              background: "rgba(248, 81, 73, 0.12)",
              borderColor: "rgba(248, 81, 73, 0.4)",
              color: "#f85149"
            }}
          >
            {validationErrors.map((item, index) => (
              <div key={`${item}-${index}`}>⚠️ {item}</div>
            ))}
          </div>
        ) : null}

        {error ? (
          <div
            style={{
              ...alertBase,
              background: "rgba(248, 81, 73, 0.12)",
              borderColor: "rgba(248, 81, 73, 0.4)",
              color: "#f85149"
            }}
          >
            {error}
          </div>
        ) : null}

        {success ? (
          <div
            style={{
              ...alertBase,
              background: "rgba(63, 185, 80, 0.12)",
              borderColor: "rgba(63, 185, 80, 0.35)",
              color: "#3fb950"
            }}
          >
            {success}
          </div>
        ) : null}

        {activeTab === "schedule" ? (
          <div className="space-y-6">
            {DAYS.map((day) => (
              <DayGroup
                key={day}
                day={day}
                slots={slotsByDay[day]}
                isOff={offDays.includes(day)}
                onToggleOff={handleToggleOff}
                onAddSlot={handleAddSlot}
                onChangeSlot={handleChangeSlot}
                onRemoveSlot={handleRemoveSlot}
              />
            ))}

            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                onClick={handleSaveSchedule}
                disabled={saving}
                style={{
                  background: "#00b4c8",
                  color: "#0d1117",
                  padding: "10px 18px",
                  borderRadius: "12px",
                  fontWeight: 600,
                  opacity: saving ? 0.7 : 1
                }}
              >
                {saving ? <LoadingSpinner label="Saving..." /> : "Save schedule"}
              </button>
            </div>
          </div>
        ) : null}

        {activeTab === "leave" ? (
          <div className="space-y-6">
            <div
              className="rounded-2xl border p-5"
              style={{
                borderColor: "#30363d",
                background: "linear-gradient(135deg, #161b22, #0d1117)"
              }}
            >
              <div className="grid gap-4 md:grid-cols-3">
                <label className="flex flex-col gap-2 text-sm" style={{ color: "#c9d1d9" }}>
                  Date
                  <input
                    type="date"
                    min={formatDateInput(new Date())}
                    value={blockDate}
                    onChange={(event) => setBlockDate(event.target.value)}
                    style={{
                      backgroundColor: "#0d1117",
                      border: "1px solid #30363d",
                      color: "#e6edf3",
                      borderRadius: "10px",
                      padding: "8px 10px"
                    }}
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm" style={{ color: "#c9d1d9" }}>
                  Reason (optional)
                  <input
                    type="text"
                    maxLength={100}
                    value={blockReason}
                    onChange={(event) => setBlockReason(event.target.value)}
                    placeholder="Annual Leave"
                    style={{
                      backgroundColor: "#0d1117",
                      border: "1px solid #30363d",
                      color: "#e6edf3",
                      borderRadius: "10px",
                      padding: "8px 10px"
                    }}
                  />
                </label>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleBlockDate}
                    disabled={blocking}
                    style={{
                      background: "#00b4c8",
                      color: "#0d1117",
                      padding: "10px 18px",
                      borderRadius: "12px",
                      fontWeight: 600,
                      opacity: blocking ? 0.7 : 1
                    }}
                  >
                    {blocking ? "Blocking..." : "Block date"}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {blockedDates.length ? (
                blockedDates.map((entry) => {
                  const dateKey = toDateKey(entry.date);

                  return (
                    <div
                      key={`${dateKey}-${entry.reason || "leave"}`}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4"
                      style={{
                        borderColor: "#30363d",
                        background: "#161b22"
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <CalendarIcon />
                        <div>
                          <div className="text-sm" style={{ color: "#e6edf3" }}>
                            {formatDateDisplay(entry.date)}
                          </div>
                          <span
                            style={{
                              background: "rgba(0, 180, 200, 0.15)",
                              color: "#7be0e6",
                              padding: "2px 10px",
                              borderRadius: "999px",
                              fontSize: "12px",
                              display: "inline-flex",
                              marginTop: "6px"
                            }}
                          >
                            {entry.reason || "Leave"}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveBlockedDate(dateKey)}
                        disabled={removingDate === dateKey}
                        style={{
                          border: "1px solid #30363d",
                          color: "#f85149",
                          padding: "8px 12px",
                          borderRadius: "10px",
                          fontSize: "12px",
                          textTransform: "uppercase",
                          letterSpacing: "0.2em",
                          background: "transparent",
                          opacity: removingDate === dateKey ? 0.6 : 1
                        }}
                      >
                        {removingDate === dateKey ? "Removing..." : "Remove"}
                      </button>
                    </div>
                  );
                })
              ) : (
                <p style={{ color: "#8b949e" }}>
                  No blocked dates. You are available on all dates.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Availability;
