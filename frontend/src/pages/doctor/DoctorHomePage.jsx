import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { BadgeCheck, ClipboardList, Stethoscope, CalendarDays, Users, Bell, ArrowRight, FileBadge2, Link2, Upload, X } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PortalLayout from "../../components/common/PortalLayout.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { resubmitDoctorVerification } from "../../services/authApi.js";
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
  const fileInputRef = useRef(null);
  const maxFileSizeBytes = 10 * 1024 * 1024;

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
    { icon: CalendarDays, label: "View Schedule", desc: "Today's appointments", to: "/doctor/appointments", accent: "#2F80ED" },
    { icon: Users, label: "Patient Records", desc: "Access clinical files", to: "/doctor/patients", accent: "#56CCF2" },
    { icon: Bell, label: "Notifications", desc: "Alerts & updates", to: "/doctor/notifications", accent: "#F2994A" },
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
              {quickActions.map(({ icon, label, desc, to, accent }, i) => {
                const IconComponent = icon;

                return (
                <MotionDiv key={label} variants={cardPop} initial="hidden" animate="visible" custom={i * 0.1}>
                  <Link
                    to={to}
                    className="group flex items-center gap-3 rounded-xl p-4 transition-all duration-300 hover:-translate-y-0.5"
                    style={{
                      background: `${accent}12`,
                      border: `1px solid ${accent}25`,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 10px 30px ${accent}25`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
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
                  </Link>
                </MotionDiv>
                );
              })}
            </div>
          </div>

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
