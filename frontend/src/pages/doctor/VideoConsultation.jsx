import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios.js";
import { fetchDoctorAppointment } from "../../api/doctorApi.js";
import ErrorState from "../../components/common/ErrorState.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import Toast from "../../components/common/Toast.jsx";

const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Something went wrong.";

const formatSessionTime = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
};

const fetchTelemedicineSession = (appointmentId) =>
  api.get(`/api/sessions/appointment/${appointmentId}`);

const joinTelemedicineSession = (sessionId) =>
  api.post(`/api/sessions/${sessionId}/join`, {});

const VideoConsultation = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [roomUrl, setRoomUrl] = useState("");
  const [appointment, setAppointment] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [sessionId, setSessionId] = useState("");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toasts, setToasts] = useState([]);
  const [ending, setEnding] = useState(false);

  const addToast = (message, type = "success") => {
    setToasts((current) => [
      ...current,
      { id: `${Date.now()}-${Math.random()}`, message, type }
    ]);
  };

  const removeToast = (id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const resolveDoctorId = async () => {
    const storedUserId = localStorage.getItem("userId");

    if (!storedUserId) {
      return null;
    }

    const response = await api.get("/api/doctors");
    const doctors = response.data?.data?.doctors || response.data?.doctors || [];
    const match = doctors.find((doctor) => String(doctor.userId) === String(storedUserId));

    return match?._id || null;
  };

  useEffect(() => {
    const loadSession = async () => {
      setLoading(true);
      setError("");

      try {
        const [sessionResponse, appointmentResponse] = await Promise.all([
          fetchTelemedicineSession(appointmentId),
          fetchDoctorAppointment(appointmentId)
        ]);

        const sessionPayload = sessionResponse.data?.data || sessionResponse.data;
        const session = sessionPayload?.session || sessionPayload;
        const sessionId = session?._id || session?.id || session?.sessionId;
        let nextRoomUrl =
          session?.jitsiRoomUrl || session?.roomUrl || session?.meetingLink || "";

        if (!sessionId) {
          throw new Error("Telemedicine session is not available.");
        }

        const joinResponse = await joinTelemedicineSession(sessionId);
        const joinPayload = joinResponse.data?.data || joinResponse.data;
        if (joinPayload?.warning) {
          addToast(joinPayload.warning, "error");
        }
        nextRoomUrl =
          joinPayload?.jitsiRoomUrl ||
          joinPayload?.roomUrl ||
          joinPayload?.meetingLink ||
          nextRoomUrl;

        setSessionId(sessionId);
        setSessionInfo({
          ...session,
          status: joinPayload?.status || session?.status,
          patientJoined:
            joinPayload?.patientJoined ?? session?.patientJoined ?? false,
          doctorJoined:
            joinPayload?.doctorJoined ?? session?.doctorJoined ?? false,
          sessionStartedAt:
            joinPayload?.sessionStartedAt || session?.sessionStartedAt || null
        });

        const appointmentData =
          appointmentResponse.data?.data?.appointment || appointmentResponse.data?.appointment;

        setRoomUrl(nextRoomUrl);
        setAppointment(appointmentData || null);

        const patientId =
          appointmentData?.patientId || appointmentData?.patient?._id || appointmentData?.patient?.id;

        if (patientId) {
          const doctorId = await resolveDoctorId();
          if (doctorId) {
            const reportResponse = await api.get(
              `/api/doctors/${doctorId}/patient-reports/${patientId}`
            );
            const reportPayload = reportResponse.data?.data || {};
            const nextReports = Array.isArray(reportPayload.reports)
              ? reportPayload.reports
              : [];
            setReports(nextReports);
          }
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [appointmentId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-10">
        <LoadingSpinner label="Loading consultation..." />
      </div>
    );
  }

  if (error) {
    return <ErrorState description={error} />;
  }

  const statusLabel = String(sessionInfo?.status || "").toUpperCase() || "UNKNOWN";
  const isFinalStatus = ["COMPLETED", "CANCELLED"].includes(statusLabel);
  const doctorJoinedLabel = sessionInfo?.doctorJoined ? "Yes" : "No";
  const patientJoinedLabel = sessionInfo?.patientJoined ? "Yes" : "No";

  const handleEndSession = async () => {
    if (!sessionId) {
      addToast("Session is not available.", "error");
      return;
    }

    setEnding(true);

    try {
      const response = await api.put(`/api/sessions/${sessionId}/end`, {
        sessionOutcome: "completed"
      });
      const payload = response.data?.data || response.data;

      setSessionInfo((current) => ({
        ...current,
        status: payload?.status || "completed",
        sessionEndedAt: payload?.sessionEndedAt || new Date().toISOString()
      }));
      addToast("Session ended successfully.", "success");
    } catch (err) {
      addToast(getErrorMessage(err), "error");
    } finally {
      setEnding(false);
    }
  };

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-4">
          <h2 className="text-lg font-semibold text-white">Live consultation</h2>
          <p className="text-sm text-slate-400">Appointment ID: {appointmentId}</p>

          {roomUrl ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800/70">
              <iframe
                title="Telemedicine room"
                src={roomUrl}
                allow="camera; microphone; fullscreen; display-capture"
                className="h-[560px] w-full"
              />
            </div>
          ) : (
            <p className="mt-6 text-sm text-rose-200">
              Room URL is not available for this appointment.
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Patient details
            </h3>
            <p className="mt-3 text-lg font-semibold text-white">
              {appointment?.patientName || "Patient"}
            </p>
            <p className="text-sm text-slate-300">
              Patient ID: {appointment?.patientId || appointment?.patient?._id || "Unavailable"}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Status: {appointment?.status || "Unknown"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Session status
            </h3>
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              <p>Status: {statusLabel}</p>
              <p>Doctor joined: {doctorJoinedLabel}</p>
              <p>Patient joined: {patientJoinedLabel}</p>
              <p>Started at: {formatSessionTime(sessionInfo?.sessionStartedAt)}</p>
            </div>
            <button
              type="button"
              onClick={handleEndSession}
              disabled={ending || isFinalStatus}
              className="mt-4 w-full rounded-xl border px-4 py-2 text-sm font-semibold"
              style={{
                borderColor: "#f59e0b",
                color: isFinalStatus ? "#9ca3af" : "#f59e0b",
                opacity: ending ? 0.7 : 1
              }}
            >
              {ending ? "Ending..." : isFinalStatus ? "Session Ended" : "End Session"}
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Medical reports
            </h3>
            {reports.length ? (
              <ul className="mt-4 space-y-3 text-sm text-slate-300">
                {reports.map((report, index) => (
                  <li key={`${report?._id || report?.id || index}`} className="rounded-xl border border-slate-800/70 bg-slate-950/60 p-3">
                    <p className="text-sm font-semibold text-white">{report?.title || `Report ${index + 1}`}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {report?.summary || report?.notes || "No description provided."}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-400">No reports attached to this appointment.</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate(`/doctor/prescription/${appointmentId}`)}
            className="w-full rounded-xl bg-[#01696f] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#028a93]"
          >
            Issue Prescription
          </button>
        </div>
      </div>

      <Toast toasts={toasts} onRemove={removeToast} />
    </>
  );
};

export default VideoConsultation;
