import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import PendingCard from "../components/appointments/PendingCard.jsx";
import AppointmentModal from "../components/appointments/AppointmentModal.jsx";
import Toast from "../components/common/Toast.jsx";
import { groupAppointmentsByDate } from "../utils/groupByDate.js";

const DOCTOR_SERVICE_URL =
  import.meta.env.VITE_DOCTOR_SERVICE_URL || "http://localhost:5029";
const PATIENT_SERVICE_URL =
  import.meta.env.VITE_PATIENT_SERVICE_URL || "http://localhost:5028";

const getToken = () =>
  localStorage.getItem("token") || localStorage.getItem("accessToken") || "";

const getAuthHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const decodeTokenPayload = (token) => {
  const payload = token?.split(".")?.[1];
  if (!payload) {
    return null;
  }

  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const resolveDoctorId = () => {
  const storedDoctorId = localStorage.getItem("doctorId");
  if (storedDoctorId) {
    return storedDoctorId;
  }

  const token = getToken();
  const payload = decodeTokenPayload(token);
  return payload?.doctorId || payload?.id || payload?.userId || null;
};

const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Something went wrong.";

const buildFallbackPatient = (patientId, fallback = {}) => ({
  id: fallback?.id || patientId || "",
  fullName: fallback?.fullName || "Patient",
  email: fallback?.email || "Not available",
  phone: fallback?.phone || "Not available",
  profilePhoto: fallback?.profilePhoto || ""
});

const dispatchPendingCount = (count) => {
  window.dispatchEvent(new CustomEvent("doctor:pending-count", { detail: { count } }));
};

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
      <div className="h-9 w-28 animate-pulse rounded" style={{ background: "#21262d" }} />
    </div>
  </div>
);

const PendingAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [exitingIds, setExitingIds] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const doctorApi = useMemo(
    () => axios.create({ baseURL: DOCTOR_SERVICE_URL }),
    []
  );
  const patientApi = useMemo(
    () => axios.create({ baseURL: PATIENT_SERVICE_URL }),
    []
  );

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
    async (patientId, fallback) => {
      if (!patientId) {
        return buildFallbackPatient("", fallback);
      }

      try {
        const response = await patientApi.get(`/api/patients/${patientId}`, {
          headers: getAuthHeaders()
        });
        const payload = response.data?.data?.patient || response.data?.patient || response.data;
        return {
          id: payload?._id || payload?.id || patientId,
          fullName: payload?.fullName || payload?.name || fallback?.fullName || "Patient",
          email: payload?.email || fallback?.email || "Not available",
          phone: payload?.phone || payload?.contactNumber || fallback?.phone || "Not available",
          profilePhoto: payload?.profilePhoto || fallback?.profilePhoto || ""
        };
      } catch {
        return buildFallbackPatient(patientId, fallback);
      }
    },
    [patientApi]
  );

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const doctorId = resolveDoctorId();
      if (!doctorId) {
        throw new Error("Doctor ID not found.");
      }

      const response = await doctorApi.get(`/api/appointments/doctor/${doctorId}`, {
        headers: getAuthHeaders(),
        params: { status: "BOOKED" }
      });

      const payload =
        response.data?.data?.appointments ||
        response.data?.appointments ||
        response.data?.data?.items ||
        response.data?.items ||
        response.data?.data ||
        response.data ||
        [];
      const items = Array.isArray(payload) ? payload : payload?.items || [];

      const enriched = await Promise.all(
        items.map(async (appointment) => {
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
          const patient = await fetchPatient(patientId, fallbackPatient);
          return {
            ...appointment,
            patient,
            mode: String(appointment.mode || "IN_PERSON").toUpperCase()
          };
        })
      );

      setAppointments(enriched);
      dispatchPendingCount(enriched.length);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [doctorApi, fetchPatient]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  useEffect(() => {
    dispatchPendingCount(appointments.length);
  }, [appointments.length]);

  const groups = useMemo(() => groupAppointmentsByDate(appointments), [appointments]);

  const markExiting = (appointmentId) => {
    setExitingIds((current) =>
      current.includes(appointmentId) ? current : [...current, appointmentId]
    );

    setTimeout(() => {
      setAppointments((current) =>
        current.filter((item) => (item._id || item.id) !== appointmentId)
      );
      setExitingIds((current) => current.filter((id) => id !== appointmentId));
    }, 220);
  };

  const handleConfirm = async (appointment) => {
    const appointmentId = appointment?._id || appointment?.id;
    if (!appointmentId) {
      addToast("Missing appointment id.", "error");
      return;
    }

    setBusyId(appointmentId);

    try {
      await doctorApi.patch(
        `/api/appointments/${appointmentId}/respond`,
        { status: "CONFIRMED", action: "ACCEPT" },
        { headers: getAuthHeaders() }
      );

      markExiting(appointmentId);
      setSelectedAppointment(null);
      setRejectReason("");
      addToast("Appointment confirmed - patient will be notified", "success");
    } catch (err) {
      addToast(getErrorMessage(err), "error");
    } finally {
      setBusyId("");
    }
  };

  const openDetailsModal = (appointment) => {
    setSelectedAppointment(appointment);
    setRejectReason("");
  };

  const handleReject = async (appointment, reason) => {
    const appointmentId = appointment?._id || appointment?.id;
    if (!appointmentId) {
      addToast("Missing appointment id.", "error");
      return;
    }

    setBusyId(appointmentId);

    try {
      await doctorApi.patch(
        `/api/appointments/${appointmentId}/respond`,
        { status: "REJECTED", action: "REJECT", reason: reason || "" },
        { headers: getAuthHeaders() }
      );

      markExiting(appointmentId);
      setSelectedAppointment(null);
      setRejectReason("");
      addToast("Appointment rejected", "error");
    } catch (err) {
      addToast(getErrorMessage(err), "error");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="space-y-6" style={{ color: "#e6edf3" }}>
        <div
          className="rounded-2xl border p-6"
          style={{ borderColor: "#30363d", background: "#161b22", borderLeft: "3px solid #d29922" }}
        >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Pending Requests</h2>
            <p className="text-sm" style={{ color: "#8b949e" }}>
              Review and respond to booking requests
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="rounded-full border px-3 py-1 text-xs"
              style={{ borderColor: "#30363d", background: "#21262d" }}
            >
              {appointments.length} requests
            </span>
            <button
              type="button"
              aria-label="Refresh pending requests"
              onClick={loadAppointments}
              className="rounded-xl border px-4 py-2 text-sm font-semibold"
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
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <LoadingSkeleton key={`pending-skeleton-${item}`} />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div
          className="rounded-2xl border p-8 text-center"
          style={{ borderColor: "#30363d", background: "#161b22" }}
        >
          <p className="text-sm" style={{ color: "#8b949e" }}>
            No pending requests. New booking requests will appear here.
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
                    {group.appointments.length} requests
                  </span>
                </div>

                <div className="space-y-2">
                  {group.appointments.map((appointment) => {
                    const appointmentId = appointment._id || appointment.id;

                    return (
                    <PendingCard
                      key={appointmentId}
                      appointment={appointment}
                      onView={openDetailsModal}
                      busy={busyId === appointmentId}
                      isExiting={exitingIds.includes(appointmentId)}
                    />
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <Toast toasts={toasts} onRemove={removeToast} />

      {selectedAppointment ? (
        <AppointmentModal
          appointment={selectedAppointment}
          onClose={() => {
            setSelectedAppointment(null);
            setRejectReason("");
          }}
          primaryActionLabel="Approve"
          primaryActionDisabled={busyId === (selectedAppointment?._id || selectedAppointment?.id)}
          onPrimaryAction={handleConfirm}
          secondaryActionLabel="Reject"
          secondaryActionDisabled={busyId === (selectedAppointment?._id || selectedAppointment?.id)}
          onSecondaryAction={handleReject}
          showReasonInput
          reasonValue={rejectReason}
          onReasonChange={setRejectReason}
          reasonPlaceholder="Reason for rejection (optional)"
          hideDefaultActions
        />
      ) : null}
    </div>
  );
};

export default PendingAppointments;
