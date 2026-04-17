import { useEffect, useMemo, useState } from "react";
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

const formatReportDate = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString();
};

const fetchTelemedicineSession = (appointmentId) =>
  api.get(`/api/sessions/appointment/${appointmentId}`);

const joinTelemedicineSession = (sessionId) =>
  api.post(`/api/sessions/${sessionId}/join`, {});

const emptyMedicine = {
  name: "",
  dose: "",
  frequency: "",
  duration: "",
  notes: ""
};

const VideoConsultation = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [roomUrl, setRoomUrl] = useState("");
  const [appointment, setAppointment] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [sessionId, setSessionId] = useState("");
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toasts, setToasts] = useState([]);
  const [ending, setEnding] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showPrescriptionPanel, setShowPrescriptionPanel] = useState(false);
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);
  const [prescriptionSubmitting, setPrescriptionSubmitting] = useState(false);
  const [prescriptionError, setPrescriptionError] = useState("");
  const [prescriptionSuccess, setPrescriptionSuccess] = useState("");
  const [prescriptionHasExisting, setPrescriptionHasExisting] = useState(false);
  const [prescriptionDiagnosis, setPrescriptionDiagnosis] = useState("");
  const [prescriptionInstructions, setPrescriptionInstructions] = useState("");
  const [prescriptionMedicines, setPrescriptionMedicines] = useState([emptyMedicine]);

  const addToast = (message, type = "success") => {
    setToasts((current) => [
      ...current,
      { id: `${Date.now()}-${Math.random()}`, message, type }
    ]);
  };

  const openInNewTab = (path) => {
    const url = path.startsWith("http") ? path : `${window.location.origin}${path}`;
    const nextTab = window.open(url, "_blank", "noopener,noreferrer");
    if (!nextTab) {
      addToast("Pop-up blocked. Please allow pop-ups for this site.", "error");
    }
  };

  const removeToast = (id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const resolveDoctorId = async () => {
    const storedDoctorId = localStorage.getItem("doctorId");
    if (storedDoctorId) {
      return storedDoctorId;
    }

    const storedUserId = localStorage.getItem("userId");

    if (!storedUserId) {
      return null;
    }

    try {
      const response = await api.get("/api/doctors", { params: { userId: storedUserId } });
      const doctors = response.data?.data?.doctors || response.data?.doctors || [];
      const match = doctors.find((doctor) => String(doctor.userId) === String(storedUserId));

      return match?._id || null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const loadSession = async () => {
      if (!appointmentId) {
        setError("Appointment is not available.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [sessionResponse, appointmentResponse] = await Promise.all([
          fetchTelemedicineSession(appointmentId),
          fetchDoctorAppointment(appointmentId)
        ]);

        const sessionPayload = sessionResponse.data?.data || sessionResponse.data;
        const session = sessionPayload?.session || sessionPayload;
        const resolvedSessionId = session?._id || session?.id || session?.sessionId;
        let nextRoomUrl =
          session?.jitsiRoomUrl || session?.roomUrl || session?.meetingLink || "";

        if (!resolvedSessionId) {
          throw new Error("Telemedicine session is not available.");
        }

        const joinResponse = await joinTelemedicineSession(resolvedSessionId);
        const joinPayload = joinResponse.data?.data || joinResponse.data;
        if (joinPayload?.warning) {
          addToast(joinPayload.warning, "error");
        }
        nextRoomUrl =
          joinPayload?.jitsiRoomUrl ||
          joinPayload?.roomUrl ||
          joinPayload?.meetingLink ||
          nextRoomUrl;

        setSessionId(resolvedSessionId);
        setSessionInfo({
          ...session,
          status: joinPayload?.status || session?.status,
          patientJoined: joinPayload?.patientJoined ?? session?.patientJoined ?? false,
          doctorJoined: joinPayload?.doctorJoined ?? session?.doctorJoined ?? false,
          sessionStartedAt:
            joinPayload?.sessionStartedAt || session?.sessionStartedAt || null
        });

        const appointmentData =
          appointmentResponse.data?.data?.appointment || appointmentResponse.data?.appointment;

        setRoomUrl(nextRoomUrl);
        setAppointment(appointmentData || null);

        const patientId =
          appointmentData?.patientId ||
          appointmentData?.patient?._id ||
          appointmentData?.patient?.id;

        if (patientId) {
          setReportsLoading(true);
          setReportsError("");
          setReports([]);

          try {
            const doctorId = await resolveDoctorId();
            if (!doctorId) {
              throw new Error("Doctor profile not found.");
            }

            const reportResponse = await api.get(
              `/api/doctors/${doctorId}/patient-reports/${patientId}`
            );
            const reportPayload = reportResponse.data?.data || {};
            const nextReports = Array.isArray(reportPayload.reports)
              ? reportPayload.reports
              : [];
            setReports(nextReports);
          } catch (reportError) {
            setReportsError(getErrorMessage(reportError));
            setReports([]);
          } finally {
            setReportsLoading(false);
          }
        } else {
          setReports([]);
          setReportsError("");
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [appointmentId]);

  useEffect(() => {
    const loadPrescription = async () => {
      if (!showPrescriptionPanel || !appointmentId) {
        return;
      }

      setPrescriptionLoading(true);
      setPrescriptionError("");
      setPrescriptionSuccess("");

      const resetPrescriptionState = () => {
        setPrescriptionHasExisting(false);
        setPrescriptionDiagnosis("");
        setPrescriptionInstructions("");
        setPrescriptionMedicines([emptyMedicine]);
      };

      try {
        const response = await api.get(`/api/prescriptions/appointment/${appointmentId}`);
        const payload =
          response.data?.data?.prescription ||
          response.data?.prescription ||
          response.data?.data ||
          null;

        if (payload) {
          setPrescriptionHasExisting(true);
          setPrescriptionDiagnosis(payload.diagnosis || "");
          setPrescriptionInstructions(payload.instructions || "");
          setPrescriptionMedicines(
            Array.isArray(payload.medicines) && payload.medicines.length
              ? payload.medicines
              : [emptyMedicine]
          );
        } else {
          resetPrescriptionState();
        }
      } catch (err) {
        if (err?.response?.status === 404) {
          resetPrescriptionState();
        } else {
          setPrescriptionError(getErrorMessage(err));
        }
      } finally {
        setPrescriptionLoading(false);
      }
    };

    loadPrescription();
  }, [appointmentId, showPrescriptionPanel]);

  const updateMedicine = (index, key, value) => {
    setPrescriptionMedicines((current) =>
      current.map((medicine, medicineIndex) =>
        medicineIndex === index ? { ...medicine, [key]: value } : medicine
      )
    );
  };

  const addMedicine = () => {
    setPrescriptionMedicines((current) => [...current, emptyMedicine]);
  };

  const removeMedicine = (index) => {
    setPrescriptionMedicines((current) =>
      current.length > 1 ? current.filter((_, medicineIndex) => medicineIndex !== index) : current
    );
  };

  const handleSavePrescription = async () => {
    if (!appointmentId) {
      setPrescriptionError("Appointment is not available.");
      return;
    }

    const patientId =
      appointment?.patientId || appointment?.patient?._id || appointment?.patient?.id;

    const trimmedDiagnosis = prescriptionDiagnosis.trim();
    const trimmedInstructions = prescriptionInstructions.trim();

    if (!trimmedDiagnosis) {
      setPrescriptionError("Diagnosis is required before saving.");
      return;
    }

    if (!trimmedInstructions) {
      setPrescriptionError("Instructions are required before saving.");
      return;
    }

    const cleanedMedicines = prescriptionMedicines
      .map((medicine) => ({
        name: medicine.name?.trim() || "",
        dose: medicine.dose?.trim() || "",
        frequency: medicine.frequency?.trim() || "",
        duration: medicine.duration?.trim() || "",
        notes: medicine.notes?.trim() || ""
      }))
      .filter((medicine) => medicine.name);

    if (!cleanedMedicines.length) {
      setPrescriptionError("Add at least one medicine before saving.");
      return;
    }

    if (!prescriptionHasExisting && !patientId) {
      setPrescriptionError("Patient is not available for this appointment.");
      return;
    }

    setPrescriptionSubmitting(true);
    setPrescriptionError("");
    setPrescriptionSuccess("");

    try {
      const isUpdate = prescriptionHasExisting;

      if (isUpdate) {
        await api.patch(`/api/prescriptions/appointment/${appointmentId}`, {
          diagnosis: trimmedDiagnosis,
          instructions: trimmedInstructions,
          medicines: cleanedMedicines
        });
      } else {
        await api.post("/api/prescriptions", {
          appointmentId,
          patientId,
          diagnosis: trimmedDiagnosis,
          instructions: trimmedInstructions,
          medicines: cleanedMedicines
        });
        setPrescriptionHasExisting(true);
      }

      const successMessage = isUpdate
        ? "Prescription updated successfully."
        : "Prescription created successfully.";
      setPrescriptionSuccess(successMessage);
      addToast(successMessage, "success");
      setTimeout(() => setShowPrescriptionPanel(false), 500);
    } catch (err) {
      setPrescriptionError(getErrorMessage(err));
    } finally {
      setPrescriptionSubmitting(false);
    }
  };

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

  const handleMarkCompleted = async () => {
    if (!appointmentId) {
      addToast("Appointment is not available.", "error");
      return;
    }

    setCompleting(true);

    try {
      await api.patch(`/api/appointments/${appointmentId}/complete`, {});
      setAppointment((current) =>
        current
          ? {
              ...current,
              status: "COMPLETED",
              statusTimestamps: {
                ...current.statusTimestamps,
                completedAt: new Date().toISOString()
              }
            }
          : current
      );
      addToast("Appointment marked as completed.", "success");
      navigate("/doctor/schedule");
    } catch (err) {
      addToast(getErrorMessage(err), "error");
    } finally {
      setCompleting(false);
    }
  };

  const statusLabel = String(sessionInfo?.status || "").toUpperCase() || "UNKNOWN";
  const isFinalStatus = ["COMPLETED", "CANCELLED"].includes(statusLabel);
  const isAppointmentCompleted =
    String(appointment?.status || "").toUpperCase() === "COMPLETED";
  const doctorJoinedLabel = sessionInfo?.doctorJoined ? "Yes" : "No";
  const patientJoinedLabel = sessionInfo?.patientJoined ? "Yes" : "No";

  const sortedReports = useMemo(() => {
    if (!Array.isArray(reports)) {
      return [];
    }

    return [...reports].sort((first, second) => {
      const firstDate = new Date(first?.uploadDate || first?.createdAt || 0).getTime();
      const secondDate = new Date(second?.uploadDate || second?.createdAt || 0).getTime();
      return secondDate - firstDate;
    });
  }, [reports]);

  const latestReport = sortedReports[0] || null;

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
            <button
              type="button"
              onClick={handleMarkCompleted}
              disabled={completing || isAppointmentCompleted}
              className="mt-3 w-full rounded-xl border px-4 py-2 text-sm font-semibold"
              style={{
                borderColor: "#22c55e",
                color: isAppointmentCompleted ? "#9ca3af" : "#22c55e",
                opacity: completing ? 0.7 : 1
              }}
            >
              {completing
                ? "Marking..."
                : isAppointmentCompleted
                  ? "Appointment Completed"
                  : "Mark Appointment Completed"}
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Medical reports
            </h3>
            {reportsLoading ? (
              <p className="mt-3 text-sm text-slate-400">Loading reports...</p>
            ) : reportsError ? (
              <p className="mt-3 text-sm text-rose-200">{reportsError}</p>
            ) : sortedReports.length ? (
              <ul className="mt-4 space-y-3 text-sm text-slate-300">
                {sortedReports.map((report, index) => (
                  <li
                    key={`${report?.publicId || report?.url || index}`}
                    className="rounded-xl border border-slate-800/70 bg-slate-950/60 p-3"
                  >
                    <p className="text-sm font-semibold text-white">
                      {report?.filename || `Report ${index + 1}`}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {report?.mimeType || "File"}
                      {report?.uploadDate ? ` • ${formatReportDate(report.uploadDate)}` : ""}
                    </p>
                    {report?.url ? (
                      <a
                        href={report.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex text-xs font-semibold text-cyan-300 hover:text-cyan-200"
                      >
                        Open report
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-400">No reports attached to this appointment.</p>
            )}
            {latestReport?.url ? (
              <button
                type="button"
                onClick={() => openInNewTab(latestReport.url)}
                className="mt-3 w-full rounded-xl border px-4 py-2 text-sm font-semibold"
                style={{ borderColor: "#22c55e", color: "#22c55e" }}
              >
                View Latest Report
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Prescription
            </h3>
            <p className="text-xs text-slate-500">
              Capture diagnosis, instructions, and medicines for the patient.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowPrescriptionPanel((current) => !current);
              setPrescriptionError("");
              setPrescriptionSuccess("");
            }}
            className="rounded-xl bg-[#01696f] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#028a93]"
          >
            {showPrescriptionPanel ? "Hide Prescription" : "View / Edit Prescription"}
          </button>
        </div>

        {showPrescriptionPanel ? (
          <div className="mt-4 rounded-xl border border-slate-800/70 bg-slate-950/60 p-4">
            {prescriptionLoading ? (
              <div className="mt-3">
                <LoadingSpinner label="Loading prescription..." />
              </div>
            ) : (
              <div className="mt-2 space-y-4">
                {prescriptionError ? (
                  <p className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                    {prescriptionError}
                  </p>
                ) : null}

                {prescriptionSuccess ? (
                  <p className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                    {prescriptionSuccess}
                  </p>
                ) : null}

                <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Diagnosis
                  <textarea
                    rows={3}
                    value={prescriptionDiagnosis}
                    onChange={(event) => setPrescriptionDiagnosis(event.target.value)}
                    className="rounded-xl border border-slate-800/80 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                    placeholder="Diagnosis"
                  />
                </label>
                <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Instructions
                  <textarea
                    rows={3}
                    value={prescriptionInstructions}
                    onChange={(event) => setPrescriptionInstructions(event.target.value)}
                    className="rounded-xl border border-slate-800/80 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                    placeholder="Care instructions"
                  />
                </label>

                <div className="space-y-3">
                  {prescriptionMedicines.map((medicine, index) => (
                    <div
                      key={`medicine-${index}`}
                      className="rounded-xl border border-slate-800/70 bg-slate-950/70 p-3"
                    >
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          Name
                          <input
                            type="text"
                            value={medicine.name}
                            onChange={(event) => updateMedicine(index, "name", event.target.value)}
                            className="rounded-xl border border-slate-800/80 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                            placeholder="Medicine name"
                          />
                        </label>
                        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          Dose
                          <input
                            type="text"
                            value={medicine.dose}
                            onChange={(event) => updateMedicine(index, "dose", event.target.value)}
                            className="rounded-xl border border-slate-800/80 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                            placeholder="500mg"
                          />
                        </label>
                        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          Frequency
                          <input
                            type="text"
                            value={medicine.frequency}
                            onChange={(event) => updateMedicine(index, "frequency", event.target.value)}
                            className="rounded-xl border border-slate-800/80 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                            placeholder="Twice daily"
                          />
                        </label>
                        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          Duration
                          <input
                            type="text"
                            value={medicine.duration}
                            onChange={(event) => updateMedicine(index, "duration", event.target.value)}
                            className="rounded-xl border border-slate-800/80 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                            placeholder="7 days"
                          />
                        </label>
                      </div>
                      <label className="mt-3 flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Notes
                        <textarea
                          rows={2}
                          value={medicine.notes}
                          onChange={(event) => updateMedicine(index, "notes", event.target.value)}
                          className="rounded-xl border border-slate-800/80 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                          placeholder="Additional guidance"
                        />
                      </label>
                      {prescriptionMedicines.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeMedicine(index)}
                          className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-rose-300"
                        >
                          Remove medicine
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={addMedicine}
                    className="rounded-xl border border-slate-700/70 bg-slate-900/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-[#01696f]/40 hover:text-[#7be0e6]"
                  >
                    Add medicine
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePrescription}
                    disabled={prescriptionSubmitting}
                    className="rounded-xl bg-[#01696f] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-sm transition hover:bg-[#028a93] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {prescriptionSubmitting
                      ? "Saving..."
                      : prescriptionHasExisting
                        ? "Update prescription"
                        : "Create prescription"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-400">
            Open the prescription panel to add diagnosis, instructions, and medicines.
          </p>
        )}
      </div>

      <Toast toasts={toasts} onRemove={removeToast} />
    </>
  );
};

export default VideoConsultation;
