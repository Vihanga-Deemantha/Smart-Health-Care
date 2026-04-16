import { useState, useEffect } from "react";
import { Calendar, MapPin, User, AlertCircle, Clock, FileText } from "lucide-react";
import PatientLayout from "../../components/patient/PatientLayout.jsx";
import api from "../../services/axios.js";
import {
  cancelPatientAppointment,
  confirmPatientAppointmentAttendance,
  fetchPatientAppointment,
  fetchPatientAppointments,
  reschedulePatientAppointment
} from "../../api/patientApi.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";

const PatientAppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleStart, setRescheduleStart] = useState("");
  const [rescheduleEnd, setRescheduleEnd] = useState("");
  const [activeActionModal, setActiveActionModal] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [selectedSlotKey, setSelectedSlotKey] = useState("");

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetchPatientAppointments({ limit: 100 });
      const items = response.data?.data?.items || [];

      const uniqueDoctorIds = [...new Set(items.map((item) => item?.doctorId).filter(Boolean))];
      const doctorNameEntries = await Promise.all(
        uniqueDoctorIds.map(async (doctorId) => {
          try {
            const doctorResponse = await api.get(`/doctors/${doctorId}`);
            const doctorPayload =
              doctorResponse.data?.data?.doctor || doctorResponse.data?.data || doctorResponse.data;
            const doctorName = doctorPayload?.fullName || doctorPayload?.name || null;
            return [doctorId, doctorName];
          } catch {
            return [doctorId, null];
          }
        })
      );

      const doctorNameMap = new Map(doctorNameEntries);
      const withDoctorNames = items.map((item) => {
        const existingName = item?.doctor?.fullName || item?.doctorName || null;
        const resolvedName = existingName || doctorNameMap.get(item?.doctorId) || null;

        if (!resolvedName) {
          return { ...item, doctorName: null };
        }

        const normalizedName =
          String(resolvedName).toLowerCase().startsWith("dr.") ||
          String(resolvedName).toLowerCase().startsWith("dr ")
            ? resolvedName
            : `Dr. ${resolvedName}`;

        return { ...item, doctorName: normalizedName };
      });

      setAppointments(withDoctorNames);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to fetch appointments"));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      BOOKED: "bg-blue-400/10 text-blue-300",
      CONFIRMED: "bg-green-400/10 text-green-300",
      COMPLETED: "bg-emerald-400/10 text-emerald-300",
      CANCELLED: "bg-red-400/10 text-red-300",
      NO_SHOW: "bg-orange-400/10 text-orange-300"
    };
    return colors[status] || "bg-slate-400/10 text-slate-300";
  };

  const formatDateTime = (value) => {
    if (!value) {
      return "N/A";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  const unwrapAppointmentPayload = (payload) => {
    let current = payload;

    for (let depth = 0; depth < 6; depth += 1) {
      if (!current || typeof current !== "object") {
        break;
      }

      if (current.appointment && typeof current.appointment === "object") {
        current = current.appointment;
        continue;
      }

      if (current.data && typeof current.data === "object") {
        current = current.data;
        continue;
      }

      break;
    }

    return current;
  };

  const normalizeAppointment = (raw, fallback = {}) => {
    const source = raw && typeof raw === "object" ? raw : {};
    const base = fallback && typeof fallback === "object" ? fallback : {};

    return {
      ...base,
      ...source,
      _id: source._id || source.id || source.appointmentId || base._id || base.id || null,
      status:
        source.status ||
        source.appointmentStatus ||
        source.state ||
        base.status ||
        base.appointmentStatus ||
        null,
      mode:
        source.mode ||
        source.visitMode ||
        source.consultationMode ||
        base.mode ||
        base.visitMode ||
        null,
      startTime:
        source.startTime || source.appointmentDate || source.date || base.startTime || base.appointmentDate || null,
      endTime: source.endTime || source.endsAt || base.endTime || null,
      doctorId: source.doctorId || source.doctor?._id || source.doctor?.id || base.doctorId || null,
      doctorName: source.doctorName || source.doctor?.fullName || base.doctorName || null,
      reason: source.reason || source.notes || source.note || base.reason || null,
      telemedicine: source.telemedicine || base.telemedicine || null,
      location: source.location || source.hospital || source.clinic || base.location || null
    };
  };

  const toLocalDateTimeInput = (value) => {
    if (!value) {
      return "";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const toDateInputValue = (dateValue) => {
    const date = new Date(dateValue);
    const timezoneOffset = date.getTimezoneOffset() * 60 * 1000;
    return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
  };

  const formatSlotTime = (isoValue) =>
    new Date(isoValue).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });

  const withDefaultEndTime = (startValue, endValue, appointment) => {
    if (endValue) {
      return endValue;
    }

    const startDate = new Date(startValue);
    if (Number.isNaN(startDate.getTime())) {
      return "";
    }

    const currentStart = new Date(appointment?.startTime || 0);
    const currentEnd = new Date(appointment?.endTime || 0);
    const hasCurrentRange =
      Number.isFinite(currentStart.getTime()) && Number.isFinite(currentEnd.getTime()) && currentEnd > currentStart;
    const durationMs = hasCurrentRange ? currentEnd.getTime() - currentStart.getTime() : 30 * 60 * 1000;

    return toLocalDateTimeInput(new Date(startDate.getTime() + durationMs).toISOString());
  };

  const resetActionState = () => {
    setActionLoading("");
    setActionError("");
    setActionSuccess("");
  };

  const loadAppointmentDetailsById = async (appointmentId, fallback = {}) => {
    const response = await fetchPatientAppointment(appointmentId);
    const detailPayload = unwrapAppointmentPayload(response.data);

    if (detailPayload && typeof detailPayload === "object") {
      const normalized = normalizeAppointment(detailPayload, fallback);
      setSelectedAppointment(normalized);
      setRescheduleStart(toLocalDateTimeInput(normalized.startTime));
      setRescheduleEnd(toLocalDateTimeInput(normalized.endTime));
      return normalized;
    }

    return null;
  };

  const closeDetails = () => {
    setSelectedAppointment(null);
    setDetailsError("");
    setDetailsLoading(false);
    setActiveActionModal(null);
    setCancelReason("");
    setRescheduleStart("");
    setRescheduleEnd("");
    setRescheduleDate("");
    setAvailableSlots([]);
    setSlotsError("");
    setSelectedSlotKey("");
    resetActionState();
  };

  const openActionModal = (modalType) => {
    setActionError("");
    setActionSuccess("");
    setSlotsError("");

    if (modalType === "reschedule") {
      const fallbackDate = selectedAppointment?.startTime
        ? toDateInputValue(selectedAppointment.startTime)
        : toDateInputValue(Date.now() + 24 * 60 * 60 * 1000);
      setRescheduleDate(fallbackDate);
      setSelectedSlotKey("");
    }

    setActiveActionModal(modalType);
  };

  const closeActionModal = () => {
    setActiveActionModal(null);
  };

  useEffect(() => {
    const loadAvailableSlots = async () => {
      if (activeActionModal !== "reschedule") {
        return;
      }

      const doctorId = selectedAppointment?.doctorId;
      if (!doctorId || !rescheduleDate) {
        setAvailableSlots([]);
        return;
      }

      setSlotsLoading(true);
      setSlotsError("");

      try {
        const response = await api.get(`/doctors/${doctorId}/availability`, {
          params: {
            date: rescheduleDate,
            mode: selectedAppointment?.mode || "TELEMEDICINE"
          }
        });

        const payload = response.data?.data;
        const nextSlots = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.slots)
            ? payload.slots
            : Array.isArray(payload?.items)
              ? payload.items
              : [];

        setAvailableSlots(nextSlots);

        if (
          selectedSlotKey &&
          !nextSlots.some((slot) => `${slot.startTime}|${slot.endTime}` === selectedSlotKey)
        ) {
          setSelectedSlotKey("");
          setRescheduleStart("");
          setRescheduleEnd("");
        }
      } catch (err) {
        setAvailableSlots([]);
        setSlotsError(getApiErrorMessage(err, "Unable to load doctor slots for the selected date."));
      } finally {
        setSlotsLoading(false);
      }
    };

    loadAvailableSlots();
  }, [activeActionModal, rescheduleDate, selectedAppointment?.doctorId, selectedAppointment?.mode, selectedSlotKey]);

  const openAppointmentDetails = async (appointment) => {
    const normalizedFromList = normalizeAppointment(appointment);
    setSelectedAppointment(normalizedFromList);
    setDetailsLoading(true);
    setDetailsError("");
    setActionError("");
    setActionSuccess("");
    setRescheduleStart(toLocalDateTimeInput(normalizedFromList.startTime));
    setRescheduleEnd(toLocalDateTimeInput(normalizedFromList.endTime));

    try {
      const appointmentId = normalizedFromList?._id || normalizedFromList?.id;
      if (!appointmentId) {
        throw new Error("Appointment ID missing");
      }

      await loadAppointmentDetailsById(appointmentId, normalizedFromList);
    } catch (err) {
      setDetailsError(getApiErrorMessage(err, "Failed to load appointment details"));
    } finally {
      setDetailsLoading(false);
    }
  };

  const refreshAfterAction = async (appointmentId, fallback) => {
    await fetchAppointments();
    await loadAppointmentDetailsById(appointmentId, fallback);
  };

  const handleConfirmAttendance = async () => {
    const appointmentId = selectedAppointment?._id;
    if (!appointmentId) {
      return;
    }

    setActionLoading("confirm");
    setActionError("");
    setActionSuccess("");

    try {
      await confirmPatientAppointmentAttendance(appointmentId);
      setActionSuccess("Attendance confirmation sent successfully.");
      closeActionModal();
      await refreshAfterAction(appointmentId, selectedAppointment);
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Failed to confirm attendance"));
    } finally {
      setActionLoading("");
    }
  };

  const handleCancelAppointment = async () => {
    const appointmentId = selectedAppointment?._id;
    if (!appointmentId) {
      return;
    }

    if (!cancelReason.trim()) {
      setActionError("Please provide a cancellation reason.");
      return;
    }

    setActionLoading("cancel");
    setActionError("");
    setActionSuccess("");

    try {
      await cancelPatientAppointment(appointmentId, { reason: cancelReason.trim() });
      setActionSuccess("Appointment cancelled successfully.");
      closeActionModal();
      await refreshAfterAction(appointmentId, selectedAppointment);
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Failed to cancel appointment"));
    } finally {
      setActionLoading("");
    }
  };

  const handleRescheduleAppointment = async () => {
    const appointmentId = selectedAppointment?._id;
    if (!appointmentId) {
      return;
    }

    const nextEnd = withDefaultEndTime(rescheduleStart, rescheduleEnd, selectedAppointment);

    if (!rescheduleStart || !nextEnd) {
      setActionError("Please provide both new start and end times.");
      return;
    }

    const startIso = new Date(rescheduleStart).toISOString();
    const endIso = new Date(nextEnd).toISOString();

    if (new Date(endIso) <= new Date(startIso)) {
      setActionError("New end time must be after start time.");
      return;
    }

    setActionLoading("reschedule");
    setActionError("");
    setActionSuccess("");

    try {
      await reschedulePatientAppointment(appointmentId, {
        newStartTime: startIso,
        newEndTime: endIso
      });
      setActionSuccess("Appointment rescheduled successfully.");
      setRescheduleEnd(nextEnd);
      closeActionModal();
      await refreshAfterAction(appointmentId, selectedAppointment);
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Failed to reschedule appointment"));
    } finally {
      setActionLoading("");
    }
  };

  const isFinalized = ["CANCELLED", "COMPLETED", "NO_SHOW"].includes(
    String(selectedAppointment?.status || "").toUpperCase()
  );

  return (
    <PatientLayout
      eyebrow="Healthcare Management"
      title="My Appointments"
      description="View and manage your upcoming and past appointments."
      accent="cyan"
    >
      {loading && (
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-300">Loading appointments...</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-400/30 bg-red-400/5 p-4 text-red-300">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && appointments.length === 0 && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-8 text-center">
          <Calendar size={32} className="mx-auto mb-3 text-slate-500" />
          <p className="text-slate-300">No appointments yet.</p>
          <p className="text-sm text-slate-400">
            <a href="/patient/find-doctor" className="text-cyan-300 hover:text-cyan-200">
              Start by searching for a doctor
            </a>
          </p>
        </div>
      )}

      {!loading && !error && appointments.length > 0 && (
        <div className="space-y-4">
          {appointments.map((apt) => (
            <div
              key={apt._id}
              role="button"
              tabIndex={0}
              onClick={() => openAppointmentDetails(apt)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openAppointmentDetails(apt);
                }
              }}
              className="rounded-lg border border-white/10 bg-white/5 p-6 transition hover:bg-white/[0.07] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
            >
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Doctor</p>
                  <div className="mt-2 flex items-center gap-2">
                    <User size={16} className="text-cyan-300" />
                    <p className="text-white">{apt.doctorName || "Doctor"}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Date & Time</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Calendar size={16} className="text-cyan-300" />
                    <p className="text-white">
                      {new Date(apt.startTime).toLocaleDateString()}{" "}
                      {new Date(apt.startTime).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Mode</p>
                  <div className="mt-2 flex items-center gap-2">
                    <MapPin size={16} className="text-cyan-300" />
                    <p className="text-white">{apt.mode || "N/A"}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(apt.status)}`}>
                  {apt.status}
                </span>
                <span className="text-sm text-cyan-300/90">Click to view details</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedAppointment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDetails();
            }
          }}
        >
          <div className="w-full max-w-2xl rounded-xl border border-cyan-200/20 bg-slate-900 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h3 className="text-lg font-semibold">Appointment Details</h3>
              <button
                type="button"
                onClick={closeDetails}
                className="rounded px-2 py-1 text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                X
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              {detailsLoading && <p className="text-sm text-slate-300">Loading full appointment details...</p>}
              {detailsError && (
                <p className="rounded border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">
                  {detailsError}
                </p>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="mb-2 text-xs uppercase tracking-[0.25em] text-slate-400">Overview</p>
                  <p className="text-sm text-slate-200">
                    <span className="font-medium text-white">Appointment ID:</span>{" "}
                    {selectedAppointment._id || "N/A"}
                  </p>
                  <p className="mt-2 text-sm text-slate-200">
                    <span className="font-medium text-white">Status:</span>{" "}
                    <span className={`rounded-full px-2 py-0.5 text-xs ${getStatusColor(selectedAppointment.status)}`}>
                      {selectedAppointment.status || "N/A"}
                    </span>
                  </p>
                  <p className="mt-2 text-sm text-slate-200">
                    <span className="font-medium text-white">Mode:</span> {selectedAppointment.mode || "N/A"}
                  </p>
                </div>

                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="mb-2 text-xs uppercase tracking-[0.25em] text-slate-400">Doctor</p>
                  <div className="flex items-center gap-2 text-sm text-slate-200">
                    <User size={15} className="text-cyan-300" />
                    <span>
                      {selectedAppointment.doctorName ||
                        selectedAppointment.doctor?.fullName ||
                        "Doctor"}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-200">
                    <MapPin size={15} className="text-cyan-300" />
                    <span>{selectedAppointment.location || "Telemedicine / Clinic"}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="mb-2 text-xs uppercase tracking-[0.25em] text-slate-400">Schedule</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm text-slate-200">
                    <Calendar size={15} className="text-cyan-300" />
                    <span>Start: {formatDateTime(selectedAppointment.startTime)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-200">
                    <Clock size={15} className="text-cyan-300" />
                    <span>End: {formatDateTime(selectedAppointment.endTime)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="mb-2 text-xs uppercase tracking-[0.25em] text-slate-400">Notes</p>
                <div className="flex items-start gap-2 text-sm text-slate-200">
                  <FileText size={15} className="mt-0.5 text-cyan-300" />
                  <p>{selectedAppointment.reason || "No reason/notes provided"}</p>
                </div>
              </div>

              {actionError && (
                <p className="rounded border border-red-300/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
                  {actionError}
                </p>
              )}

              {actionSuccess && (
                <p className="rounded border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
                  {actionSuccess}
                </p>
              )}

              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="mb-3 text-xs uppercase tracking-[0.25em] text-slate-400">Actions</p>
                <div className="grid gap-2 md:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => openActionModal("reschedule")}
                    disabled={isFinalized || actionLoading !== ""}
                    className="rounded-lg border border-cyan-300/50 bg-cyan-400/10 px-3 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Reschedule Appointment
                  </button>
                  <button
                    type="button"
                    onClick={() => openActionModal("confirm")}
                    disabled={isFinalized || actionLoading !== ""}
                    className="rounded-lg border border-emerald-300/50 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Confirmation
                  </button>
                  <button
                    type="button"
                    onClick={() => openActionModal("cancel")}
                    disabled={isFinalized || actionLoading !== ""}
                    className="rounded-lg border border-red-300/50 bg-red-400/10 px-3 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {selectedAppointment.telemedicine?.meetingLink && (
                <div className="flex justify-end">
                  <a
                    href={selectedAppointment.telemedicine.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400"
                  >
                    Join Meeting
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedAppointment && activeActionModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeActionModal();
            }
          }}
        >
          <div className="w-full max-w-xl rounded-xl border border-cyan-200/20 bg-slate-900 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h3 className="text-lg font-semibold">
                {activeActionModal === "reschedule"
                  ? "Reschedule Appointment"
                  : activeActionModal === "confirm"
                    ? "Confirm Attendance"
                    : "Cancel Appointment"}
              </h3>
              <button
                type="button"
                onClick={closeActionModal}
                className="rounded px-2 py-1 text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                X
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              {activeActionModal === "reschedule" && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-300">
                    Choose an available slot for this doctor.
                  </p>

                  <label className="text-sm text-slate-200">
                    Select date
                    <input
                      type="date"
                      value={rescheduleDate}
                      min={toDateInputValue(Date.now())}
                      onChange={(event) => {
                        setRescheduleDate(event.target.value);
                        setSelectedSlotKey("");
                        setRescheduleStart("");
                        setRescheduleEnd("");
                      }}
                      className="mt-1 w-full rounded border border-white/15 bg-slate-800 px-3 py-2 text-sm text-slate-100"
                    />
                  </label>

                  <div>
                    <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">Available Slots</p>

                    {slotsLoading ? (
                      <div className="rounded border border-white/10 bg-slate-800/40 px-3 py-2 text-sm text-slate-300">
                        Loading slots...
                      </div>
                    ) : slotsError ? (
                      <div className="rounded border border-red-300/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
                        {slotsError}
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="rounded border border-white/10 bg-slate-800/40 px-3 py-2 text-sm text-slate-300">
                        No available slots for this date.
                      </div>
                    ) : (
                      <div className="grid gap-2 md:grid-cols-2">
                        {availableSlots.map((slot) => {
                          const slotKey = `${slot.startTime}|${slot.endTime}`;
                          const isActive = selectedSlotKey === slotKey;

                          return (
                            <button
                              key={slotKey}
                              type="button"
                              onClick={() => {
                                setSelectedSlotKey(slotKey);
                                setRescheduleStart(slot.startTime);
                                setRescheduleEnd(slot.endTime);
                              }}
                              className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                                isActive
                                  ? "border-cyan-300/60 bg-cyan-400/20 text-cyan-100"
                                  : "border-white/15 bg-slate-900/50 text-slate-200 hover:border-cyan-300/40 hover:text-cyan-100"
                              }`}
                            >
                              {formatSlotTime(slot.startTime)} - {formatSlotTime(slot.endTime)}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="rounded border border-white/10 bg-slate-800/40 px-3 py-2 text-sm text-slate-200">
                    Selected slot:{" "}
                    {rescheduleStart && rescheduleEnd
                      ? `${formatSlotTime(rescheduleStart)} - ${formatSlotTime(rescheduleEnd)}`
                      : "No slot selected"}
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={closeActionModal}
                      className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-slate-200"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={handleRescheduleAppointment}
                      disabled={actionLoading !== ""}
                      className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {actionLoading === "reschedule" ? "Saving..." : "Save Reschedule"}
                    </button>
                  </div>
                </div>
              )}

              {activeActionModal === "confirm" && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-300">
                    Confirm that you attended or are ready to attend this appointment.
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={closeActionModal}
                      className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-slate-200"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmAttendance}
                      disabled={actionLoading !== ""}
                      className="rounded-lg border border-emerald-300/50 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {actionLoading === "confirm" ? "Confirming..." : "Confirm Attendance"}
                    </button>
                  </div>
                </div>
              )}

              {activeActionModal === "cancel" && (
                <div className="space-y-3">
                  <label className="text-sm text-slate-200">
                    Cancellation reason
                    <textarea
                      rows={3}
                      value={cancelReason}
                      onChange={(event) => setCancelReason(event.target.value)}
                      placeholder="Provide reason for cancellation"
                      className="mt-1 w-full rounded border border-white/15 bg-slate-800 px-3 py-2 text-sm text-slate-100"
                    />
                  </label>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={closeActionModal}
                      className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-slate-200"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelAppointment}
                      disabled={actionLoading !== ""}
                      className="rounded-lg border border-red-300/50 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {actionLoading === "cancel" ? "Cancelling..." : "Cancel Appointment"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PatientLayout>
  );
};

export default PatientAppointmentsPage;
