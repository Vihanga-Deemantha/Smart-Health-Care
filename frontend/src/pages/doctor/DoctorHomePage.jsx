import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  BadgeCheck,
  ClipboardList,
  Stethoscope,
  CalendarDays,
  Bell,
  ArrowRight,
  FileBadge2,
  Link2,
  Upload,
  X,
  Clock3,
  Ban,
  Trash2,
  RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import PortalLayout from "../../components/common/PortalLayout.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { resubmitDoctorVerification } from "../../services/authApi.js";
import api from "../../services/axios.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";

const cardPop = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: (d = 0) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: d },
  }),
};

const formatFileSize = (size) => {
  if (!Number.isFinite(size)) {
    return "";
  }

  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
};

const weekdayOptions = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" }
];

const startHourOptions = Array.from({ length: 24 }, (_, hour) => ({
  value: hour,
  label: new Date(Date.UTC(2026, 0, 1, hour, 0, 0)).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  })
}));

const endHourOptions = Array.from({ length: 24 }, (_, index) => {
  const value = index + 1;
  const hour = value === 24 ? 23 : value;
  const base = new Date(Date.UTC(2026, 0, 1, hour, 0, 0)).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });

  return {
    value,
    label: value === 24 ? `${base} (next day)` : base
  };
});

const slotDurationOptions = [15, 20, 30, 45, 60].map((value) => ({ value, label: `${value} minutes` }));
const bufferOptions = [0, 5, 10, 15, 20, 30].map((value) => ({ value, label: `${value} minutes` }));

const availabilityPresets = [
  { id: "morning", label: "Morning Shift", startHour: 8, endHour: 12, slotDurationMinutes: 30, bufferMinutes: 0 },
  { id: "afternoon", label: "Afternoon Shift", startHour: 13, endHour: 17, slotDurationMinutes: 30, bufferMinutes: 0 },
  { id: "full", label: "Full Day", startHour: 9, endHour: 17, slotDurationMinutes: 30, bufferMinutes: 0 }
];

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString();
};

const DoctorHomePage = () => {
  const { user, accessToken, setAuth } = useAuth();
  const MotionDiv = motion.div;
  const firstName = user?.fullName?.split(" ")[0] || "Doctor";
  const needsResubmission = ["CHANGES_REQUESTED", "REJECTED"].includes(user?.doctorVerificationStatus);
  const waitingForReview = user?.doctorVerificationStatus === "PENDING";
  const hasRestrictedDoctorAccess = user?.doctorVerificationStatus !== "APPROVED";
  const [verificationFiles, setVerificationFiles] = useState([]);
  const [verificationLinksInput, setVerificationLinksInput] = useState(
    (user?.verificationLinks || []).join("\n")
  );
  const [submitting, setSubmitting] = useState(false);
  const [filesError, setFilesError] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState("");
  const [cancelReasons, setCancelReasons] = useState({});
  const [cancellingId, setCancellingId] = useState("");
  const [availabilityRules, setAvailabilityRules] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [availabilityForm, setAvailabilityForm] = useState({
    weekday: 1,
    startHour: 9,
    endHour: 17,
    slotDurationMinutes: 30,
    bufferMinutes: 0,
    mode: "IN_PERSON",
    timezone: "UTC"
  });
  const [savingRule, setSavingRule] = useState(false);
  const [deletingRuleId, setDeletingRuleId] = useState("");
  const [activeDoctorView, setActiveDoctorView] = useState("appointments");
  const fileInputRef = useRef(null);
  const maxFileSizeBytes = 10 * 1024 * 1024;

  const normalizedAvailability = {
    weekday: Number(availabilityForm.weekday),
    startHour: Number(availabilityForm.startHour),
    endHour: Number(availabilityForm.endHour),
    slotDurationMinutes: Number(availabilityForm.slotDurationMinutes),
    bufferMinutes: Number(availabilityForm.bufferMinutes)
  };

  const availabilityWindowMinutes =
    (normalizedAvailability.endHour - normalizedAvailability.startHour) * 60;
  const cycleMinutes = normalizedAvailability.slotDurationMinutes + normalizedAvailability.bufferMinutes;
  const estimatedSlots =
    availabilityWindowMinutes > 0 && cycleMinutes > 0
      ? Math.floor(availabilityWindowMinutes / cycleMinutes)
      : 0;

  const availabilityFormError =
    normalizedAvailability.endHour <= normalizedAvailability.startHour
      ? "End time must be later than start time."
      : estimatedSlots <= 0
        ? "This setup creates zero available slots."
        : "";

  const highlights = [
    {
      icon: BadgeCheck,
      accent: "#2F80ED",
      title: "Verified Clinician",
      text: "Your account has passed verification and is ready for secure clinical access and patient management.",
    },
    {
      icon: Stethoscope,
      accent: "#56CCF2",
      title: "Clinical Workspace",
      text: "Your secure starting point for schedules, appointments, and structured care workflows.",
    },
    {
      icon: ClipboardList,
      accent: "#27AE60",
      title: "Protected Operations",
      text: "Doctor access is guarded through approval checks, backend controls, and real-time session monitoring.",
    },
  ];

  const quickActions = [
    {
      icon: CalendarDays,
      label: "Today's Schedule",
      desc: "Upcoming consultations",
      accent: "#2F80ED",
      view: "appointments"
    },
    {
      icon: Clock3,
      label: "Set Availability",
      desc: "Weekly slot rules",
      accent: "#56CCF2",
      view: "availability"
    },
    {
      icon: Bell,
      label: "Refresh Data",
      desc: "Load latest appointments",
      accent: "#F2994A",
      view: "refresh"
    },
  ];

  const verificationLinks = verificationLinksInput
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

  const addFiles = (incomingFiles) => {
    const supportedFiles = Array.from(incomingFiles || []);

    if (!supportedFiles.length) {
      return;
    }

    setVerificationFiles((currentFiles) => {
      const oversizedFile = supportedFiles.find((file) => file.size > maxFileSizeBytes);

      if (oversizedFile) {
        setFilesError(`${oversizedFile.name} is larger than 10 MB.`);
        return currentFiles;
      }

      const fileMap = new Map(
        currentFiles.map((file) => [`${file.name}-${file.size}-${file.lastModified}`, file])
      );

      for (const file of supportedFiles) {
        fileMap.set(`${file.name}-${file.size}-${file.lastModified}`, file);
      }

      if (fileMap.size > 5) {
        setFilesError("You can upload up to 5 files.");
      } else {
        setFilesError("");
      }

      return Array.from(fileMap.values()).slice(0, 5);
    });
  };

  const removeFile = (fileToRemove) => {
    setVerificationFiles((currentFiles) =>
      currentFiles.filter(
        (file) =>
          `${file.name}-${file.size}-${file.lastModified}` !==
          `${fileToRemove.name}-${fileToRemove.size}-${fileToRemove.lastModified}`
      )
    );
  };

  const handleResubmit = async () => {
    if (!verificationFiles.length && !verificationLinks.length) {
      setFilesError("Add at least one new file or one supporting link.");
      return;
    }

    setFilesError("");
    setSubmitting(true);

    try {
      const response = await resubmitDoctorVerification({
        verificationFiles,
        verificationLinks
      });
      const nextUser = response.data?.data?.user;

      setAuth(nextUser, accessToken);
      setVerificationFiles([]);
      setVerificationLinksInput((nextUser?.verificationLinks || []).join("\n"));
      toast.success("Verification details re-submitted successfully");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to re-submit verification."));
    } finally {
      setSubmitting(false);
    }
  };

  const loadAppointments = async () => {
    try {
      setAppointmentsLoading(true);
      setAppointmentsError("");

      const response = await api.get("/appointments", {
        params: {
          from: new Date().toISOString(),
          limit: 50
        }
      });

      setAppointments(response.data?.data?.items || []);
    } catch (error) {
      setAppointmentsError(getApiErrorMessage(error, "Failed to fetch your appointments."));
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const loadAvailabilityRules = async () => {
    try {
      setRulesLoading(true);
      const response = await api.get("/doctors/me/availability-rules");
      setAvailabilityRules(response.data?.data || []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to fetch availability rules."));
    } finally {
      setRulesLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    const reason = (cancelReasons[appointmentId] || "Cancelled by doctor").trim();

    try {
      setCancellingId(appointmentId);
      await api.patch(`/appointments/${appointmentId}/cancel`, { reason });
      toast.success("Appointment cancelled.");
      await loadAppointments();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to cancel appointment."));
    } finally {
      setCancellingId("");
    }
  };

  const handleSaveAvailabilityRule = async (event) => {
    event.preventDefault();

    if (availabilityFormError) {
      toast.error(availabilityFormError);
      return;
    }

    try {
      setSavingRule(true);
      await api.post("/doctors/me/availability-rules", {
        weekday: normalizedAvailability.weekday,
        startHour: normalizedAvailability.startHour,
        endHour: normalizedAvailability.endHour,
        slotDurationMinutes: normalizedAvailability.slotDurationMinutes,
        bufferMinutes: normalizedAvailability.bufferMinutes,
        mode: availabilityForm.mode,
        timezone: availabilityForm.timezone
      });

      toast.success("Availability rule added.");
      await loadAvailabilityRules();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to create availability rule."));
    } finally {
      setSavingRule(false);
    }
  };

  const handleDeleteAvailabilityRule = async (ruleId) => {
    try {
      setDeletingRuleId(ruleId);
      await api.delete(`/doctors/me/availability-rules/${ruleId}`);
      toast.success("Availability rule removed.");
      await loadAvailabilityRules();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to remove availability rule."));
    } finally {
      setDeletingRuleId("");
    }
  };

  const handleQuickActionClick = async (view) => {
    if (view === "refresh") {
      await Promise.all([loadAppointments(), loadAvailabilityRules()]);
      toast.success("Doctor data refreshed.");
      return;
    }

    setActiveDoctorView(view);
  };

  useEffect(() => {
    if (hasRestrictedDoctorAccess) {
      return;
    }

    loadAppointments();
    loadAvailabilityRules();
  }, [hasRestrictedDoctorAccess]);

  return (
    <PortalLayout
      eyebrow="Doctor Portal"
      title={`Welcome back, Dr. ${firstName}`}
      description={
        needsResubmission
          ? "Your account needs updated verification details before full clinical access is restored."
          : waitingForReview
            ? "Your verification has been submitted and is waiting for admin review before full clinical access is restored."
          : "Your clinical workspace is ready. Manage appointments, access patient records, and stay connected with your care team."
      }
      accent="blue"
    >
      {hasRestrictedDoctorAccess ? (
        <div className="space-y-6">
          <MotionDiv
            variants={cardPop}
            initial="hidden"
            animate="visible"
            custom={0.05}
            className={`rounded-[28px] p-6 ${needsResubmission ? "border border-amber-400/20 bg-amber-500/10" : "border border-cyan-400/20 bg-cyan-500/10"}`}
          >
            <p className={`text-[10px] font-bold uppercase tracking-widest ${needsResubmission ? "text-amber-300" : "text-cyan-200"}`}>
              {needsResubmission ? "Verification Update Required" : "Verification In Review"}
            </p>
            <h2 className="mt-3 text-2xl font-black text-white">
              {needsResubmission ? "Documents need attention" : "Waiting for approval"}
            </h2>
            {needsResubmission ? (
              <p className="mt-3 text-sm leading-relaxed text-amber-100/80">
                {user?.doctorRejectionReason || "The admin team requested updated verification details before approval."}
              </p>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-cyan-100/80">
                Your updated verification details have been submitted successfully. The admin team
                will review them before restoring full doctor access.
              </p>
            )}
            <p className="mt-4 text-sm text-slate-300">
              {needsResubmission
                ? "Upload corrected documents or supporting links below. Once you submit them again, your account will move back to pending review."
                : "You can stay signed in, but doctor features should remain restricted until approval is complete."}
            </p>
          </MotionDiv>

          {needsResubmission ? (
            <MotionDiv
              variants={cardPop}
              initial="hidden"
              animate="visible"
              custom={0.15}
              className="rounded-[28px] border border-white/10 bg-white/5 p-6"
            >
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">License</p>
                <p className="mt-2 text-sm font-semibold text-white">{user?.medicalLicenseNumber || "-"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Specialization</p>
                <p className="mt-2 text-sm font-semibold text-white">{user?.specialization || "-"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Experience</p>
                <p className="mt-2 text-sm font-semibold text-white">{user?.yearsOfExperience ?? 0} years</p>
              </div>
            </div>

            <div className="mt-6 rounded-[24px] border border-cyan-400/20 bg-cyan-500/10 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/15">
                  <FileBadge2 size={20} className="text-cyan-200" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-200">
                    Resubmit Verification
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-200">
                    Upload revised certificates, scans, or images, and add supporting links if they
                    help the admin team validate your account faster.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-5 flex w-full flex-col items-center justify-center rounded-[22px] border border-dashed border-cyan-300/25 bg-white/5 px-4 py-6 text-center transition-all duration-200 hover:scale-[1.01]"
              >
                <Upload size={22} className="text-cyan-200" />
                <p className="mt-3 text-sm font-bold text-white">Select updated files</p>
                <p className="mt-1 text-xs text-slate-400">Up to 5 files, 10 MB each</p>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,application/pdf,image/png,image/jpeg,image/jpg,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                multiple
                className="hidden"
                onChange={(event) => {
                  addFiles(event.target.files);
                  event.target.value = "";
                }}
              />

              {verificationFiles.length ? (
                <div className="mt-4 space-y-3">
                  {verificationFiles.map((file) => (
                    <div
                      key={`${file.name}-${file.size}-${file.lastModified}`}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{file.name}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {file.type || "Document"} • {formatFileSize(file.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(file)}
                        className="ml-3 rounded-full p-2 text-slate-400 transition-colors hover:bg-white/10"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-5">
                <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-slate-300">
                  <Link2 size={11} className="text-cyan-200" />
                  Supporting Links
                </label>
                <textarea
                  value={verificationLinksInput}
                  onChange={(event) => setVerificationLinksInput(event.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-500"
                  placeholder={"https://example.com/license\nhttps://example.com/certificate"}
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  Add one URL per line if you want to share registry, portfolio, or document links.
                </p>
              </div>

              {filesError ? <p className="mt-4 text-sm text-rose-300">{filesError}</p> : null}

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleResubmit}
                  className="rounded-2xl bg-linear-to-r from-cyan-400 to-blue-400 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
                >
                  {submitting ? "Submitting updates..." : "Re-submit for review"}
                </button>
              </div>
            </div>
            </MotionDiv>
          ) : null}
        </div>
      ) : (
        <>
          <div className="mb-8">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>Quick Actions</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {quickActions.map(({ icon, label, desc, accent, view }, i) => {
                const IconComponent = icon;
                const isActive = activeDoctorView === view;

                return (
                <MotionDiv key={label} variants={cardPop} initial="hidden" animate="visible" custom={i * 0.1}>
                  <button
                    type="button"
                    onClick={() => handleQuickActionClick(view)}
                    className="group flex items-center gap-3 rounded-xl p-4 transition-all duration-300 hover:-translate-y-0.5"
                    style={{
                      background: isActive ? `${accent}20` : `${accent}12`,
                      border: isActive ? `1px solid ${accent}55` : `1px solid ${accent}25`,
                      boxShadow: isActive ? `0 8px 24px ${accent}30` : "none",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 10px 30px ${accent}25`; }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = isActive ? `0 8px 24px ${accent}30` : "none";
                    }}
                  >
                    <div
                      className="h-10 w-10 flex items-center justify-center rounded-xl flex-shrink-0"
                      style={{ background: `${accent}20`, border: `1px solid ${accent}30` }}
                    >
                      <IconComponent size={18} style={{ color: accent }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">{label}</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{desc}</p>
                    </div>
                    <ArrowRight size={14} className="flex-shrink-0 transition-transform group-hover:translate-x-1" style={{ color: accent }} />
                  </button>
                </MotionDiv>
                );
              })}
            </div>
          </div>

          {activeDoctorView === "appointments" ? (
          <MotionDiv
            id="appointments"
            variants={cardPop}
            initial="hidden"
            animate="visible"
            custom={0.2}
            className="mb-8 rounded-2xl border border-white/10 bg-slate-950/40 p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-200">My Appointments</p>
                <h3 className="mt-1 text-lg font-bold text-white">Upcoming Schedule</h3>
              </div>
              <button
                type="button"
                onClick={loadAppointments}
                disabled={appointmentsLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-100 disabled:opacity-60"
              >
                <RefreshCw size={14} />
                {appointmentsLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {appointmentsError ? (
              <p className="mt-4 rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{appointmentsError}</p>
            ) : null}

            {!appointmentsLoading && !appointmentsError && appointments.length === 0 ? (
              <p className="mt-4 text-sm text-slate-300">No upcoming appointments found.</p>
            ) : null}

            <div className="mt-4 space-y-3">
              {appointments.map((appointment) => {
                const isCancelled = appointment.status === "CANCELLED";
                const disableCancel = isCancelled || cancellingId === appointment._id;

                return (
                  <div key={appointment._id} className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white">Patient: {appointment.patientId}</p>
                      <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-200">
                        {appointment.status}
                      </span>
                    </div>

                    <div className="mt-2 grid gap-1 text-xs text-slate-300 sm:grid-cols-2">
                      <p><span className="text-slate-400">Start:</span> {formatDateTime(appointment.startTime)}</p>
                      <p><span className="text-slate-400">End:</span> {formatDateTime(appointment.endTime)}</p>
                      <p><span className="text-slate-400">Mode:</span> {appointment.mode}</p>
                      <p className="truncate"><span className="text-slate-400">Reason:</span> {appointment.reason || "-"}</p>
                    </div>

                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <input
                        type="text"
                        value={cancelReasons[appointment._id] || ""}
                        onChange={(event) =>
                          setCancelReasons((current) => ({
                            ...current,
                            [appointment._id]: event.target.value
                          }))
                        }
                        placeholder="Cancellation reason (optional)"
                        className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-white placeholder:text-slate-500"
                      />
                      <button
                        type="button"
                        disabled={disableCancel}
                        onClick={() => handleCancelAppointment(appointment._id)}
                        className="inline-flex items-center justify-center gap-1 rounded-lg bg-rose-500/20 px-3 py-2 text-xs font-semibold text-rose-100 disabled:opacity-50"
                      >
                        <Ban size={12} />
                        {cancellingId === appointment._id ? "Cancelling..." : "Cancel"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </MotionDiv>
          ) : null}

          {activeDoctorView === "availability" ? (
          <MotionDiv
            id="availability"
            variants={cardPop}
            initial="hidden"
            animate="visible"
            custom={0.25}
            className="mb-8 rounded-2xl border border-white/10 bg-slate-950/40 p-5"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-200">Availability Setup</p>
            <h3 className="mt-1 text-lg font-bold text-white">Define Weekly Appointment Slots</h3>
            <p className="mt-2 text-xs text-slate-400">
              Set your recurring weekly clinic hours. Patients will only see available slots from these rules.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {availabilityPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() =>
                    setAvailabilityForm((current) => ({
                      ...current,
                      startHour: preset.startHour,
                      endHour: preset.endHour,
                      slotDurationMinutes: preset.slotDurationMinutes,
                      bufferMinutes: preset.bufferMinutes
                    }))
                  }
                  className="rounded-full border border-cyan-300/20 bg-cyan-500/10 px-3 py-1.5 text-[11px] font-semibold text-cyan-100"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSaveAvailabilityRule} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Day</span>
                <select
                  value={availabilityForm.weekday}
                  onChange={(event) => setAvailabilityForm((current) => ({ ...current, weekday: Number(event.target.value) }))}
                  className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white"
                >
                  {weekdayOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Consultation Mode</span>
                <select
                  value={availabilityForm.mode}
                  onChange={(event) => setAvailabilityForm((current) => ({ ...current, mode: event.target.value }))}
                  className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white"
                >
                  <option value="IN_PERSON">In Person</option>
                  <option value="TELEMEDICINE">Telemedicine</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Start Time</span>
                <select
                  value={availabilityForm.startHour}
                  onChange={(event) => setAvailabilityForm((current) => ({ ...current, startHour: Number(event.target.value) }))}
                  className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white"
                >
                  {startHourOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">End Time</span>
                <select
                  value={availabilityForm.endHour}
                  onChange={(event) => setAvailabilityForm((current) => ({ ...current, endHour: Number(event.target.value) }))}
                  className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white"
                >
                  {endHourOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Slot Duration</span>
                <select
                  value={availabilityForm.slotDurationMinutes}
                  onChange={(event) => setAvailabilityForm((current) => ({ ...current, slotDurationMinutes: Number(event.target.value) }))}
                  className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white"
                >
                  {slotDurationOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Buffer Between Slots</span>
                <select
                  value={availabilityForm.bufferMinutes}
                  onChange={(event) => setAvailabilityForm((current) => ({ ...current, bufferMinutes: Number(event.target.value) }))}
                  className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white"
                >
                  {bufferOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Timezone</span>
                <input
                  type="text"
                  value={availabilityForm.timezone}
                  onChange={(event) => setAvailabilityForm((current) => ({ ...current, timezone: event.target.value }))}
                  placeholder="UTC"
                  className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                />
              </label>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={savingRule || Boolean(availabilityFormError)}
                  className="w-full rounded-lg bg-cyan-500/20 px-3 py-2.5 text-sm font-semibold text-cyan-100 disabled:opacity-60"
                >
                  {savingRule ? "Saving..." : "Add Rule"}
                </button>
              </div>
            </form>

            {availabilityFormError ? (
              <p className="mt-3 rounded-lg border border-rose-300/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                {availabilityFormError}
              </p>
            ) : (
              <p className="mt-3 rounded-lg border border-cyan-300/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
                Preview: {weekdayOptions.find((option) => option.value === normalizedAvailability.weekday)?.label},
                {" "}{availabilityForm.mode === "IN_PERSON" ? "In Person" : "Telemedicine"},
                {" "}{startHourOptions.find((option) => option.value === normalizedAvailability.startHour)?.label}
                {" - "}
                {endHourOptions.find((option) => option.value === normalizedAvailability.endHour)?.label},
                {" "}about {estimatedSlots} slots/day.
              </p>
            )}

            <div className="mt-4 rounded-xl border border-white/10 bg-slate-900/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Current Rules</p>
              {rulesLoading ? <p className="mt-2 text-sm text-slate-300">Loading rules...</p> : null}
              {!rulesLoading && availabilityRules.length === 0 ? (
                <p className="mt-2 text-sm text-slate-300">No availability rules yet.</p>
              ) : null}
              {!rulesLoading && availabilityRules.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {availabilityRules.map((rule) => (
                    <div key={rule._id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-slate-200">
                      <p>
                        {weekdayOptions.find((option) => option.value === rule.weekday)?.label || `Day ${rule.weekday}`}
                        {" • "}
                        {rule.mode}
                        {" • "}
                        {rule.startHour}:00 - {rule.endHour}:00
                        {" • "}
                        {rule.slotDurationMinutes}m slots
                      </p>
                      <button
                        type="button"
                        disabled={deletingRuleId === rule._id}
                        onClick={() => handleDeleteAvailabilityRule(rule._id)}
                        className="inline-flex items-center gap-1 rounded-md bg-rose-500/20 px-2 py-1 text-rose-200 disabled:opacity-50"
                      >
                        <Trash2 size={11} />
                        {deletingRuleId === rule._id ? "Removing..." : "Remove"}
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </MotionDiv>
          ) : null}

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>Platform Capabilities</p>
            <div className="grid gap-4 lg:grid-cols-3">
              {highlights.map(({ icon, accent, title, text }, i) => {
                const IconComponent = icon;

                return (
                <MotionDiv
                  key={title}
                  variants={cardPop}
                  initial="hidden"
                  animate="visible"
                  custom={0.3 + i * 0.1}
                  className="rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 10px 30px ${accent}18`; e.currentTarget.style.borderColor = `${accent}30`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
                >
                  <div
                    className="h-11 w-11 flex items-center justify-center rounded-xl mb-4"
                    style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
                  >
                    <IconComponent size={20} style={{ color: accent }} />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2">{title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{text}</p>
                </MotionDiv>
                );
              })}
            </div>
          </div>
        </>
      )}
    </PortalLayout>
  );
};

export default DoctorHomePage;
