import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios.js";
import ErrorState from "../../components/common/ErrorState.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";

const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Something went wrong.";

const VideoConsultation = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [roomUrl, setRoomUrl] = useState("");
  const [appointment, setAppointment] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          api.get(`/api/appointments/${appointmentId}/telemedicine`),
          api.get(`/api/appointments/${appointmentId}`)
        ]);

        const sessionPayload = sessionResponse.data?.data || sessionResponse.data;
        const session = sessionPayload?.session || sessionPayload;
        const nextRoomUrl =
          session?.roomUrl || session?.meetingLink || sessionPayload?.meetingLink || "";

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

  return (
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
  );
};

export default VideoConsultation;
