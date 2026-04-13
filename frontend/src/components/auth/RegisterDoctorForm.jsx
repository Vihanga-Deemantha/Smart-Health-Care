import { useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User, Mail, Phone, Lock, ShieldCheck,
  ArrowRight, ArrowLeft, CheckCircle2,
  UserCircle2, Stethoscope, KeyRound, FileText, Award, Clock3,
  Link2, Upload, FileBadge2, X
} from "lucide-react";
import { doctorRegisterSchema } from "../../schemas/auth.schema.js";
import PasswordStrengthHint from "./PasswordStrengthHint.jsx";

// ─── Steps definition ─────────────────────────────────────────────
const steps = [
  { id: 1, label: "Personal Info",    icon: UserCircle2 },
  { id: 2, label: "Clinical Details", icon: Stethoscope },
  { id: 3, label: "Account Security", icon: KeyRound },
];

// ─── Progress bar ─────────────────────────────────────────────────
const StepBar = ({ current }) => (
  <div className="mb-8">
    <div className="flex gap-1.5 mb-4">
      {steps.map((_, i) => (
        <div
          key={i}
          className="h-1 flex-1 rounded-full transition-all duration-500"
          style={{
            background: i < current
              ? "linear-gradient(90deg, #2F80ED, #56CCF2)"
              : "rgba(47,128,237,0.12)",
          }}
        />
      ))}
    </div>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#2F80ED" }}>
          Step {current} of {steps.length}
        </p>
        <p className="text-base font-extrabold tracking-tight" style={{ color: "#0B1F3A" }}>
          {steps[current - 1]?.label}
        </p>
      </div>
      <div className="flex gap-1.5">
        {steps.map((s, i) => {
          const done = i + 1 < current;
          const active = i + 1 === current;
          return (
            <div
              key={s.id}
              className="h-7 w-7 flex items-center justify-center rounded-full transition-all duration-300"
              style={{
                background: done
                  ? "#27AE60"
                  : active
                  ? "linear-gradient(135deg, #2F80ED, #56CCF2)"
                  : "rgba(47,128,237,0.1)",
                border: !done && !active ? "1.5px solid rgba(47,128,237,0.2)" : "none",
              }}
            >
              {done
                ? <CheckCircle2 size={13} className="text-white" />
                : <s.icon size={13} style={{ color: active ? "white" : "rgba(47,128,237,0.4)" }} />
              }
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

// ─── Reusable field ───────────────────────────────────────────────
const Field = ({ label, icon, name, type = "text", placeholder, register, error, focused, onFocus, onBlur, hint }) => {
  const isActive = focused === name;
  const IconComponent = icon;
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest" style={{ color: "#334155" }}>
        <IconComponent size={11} style={{ color: "#2F80ED" }} />
        {label}
      </label>
      <input
        {...register(name)}
        type={type}
        className="w-full rounded-xl px-4 py-3.5 text-sm outline-none"
        style={{
          background: isActive ? "rgba(47,128,237,0.05)" : "rgba(11,31,58,0.03)",
          border: isActive ? "1.5px solid rgba(47,128,237,0.5)" : "1.5px solid rgba(47,128,237,0.15)",
          boxShadow: isActive ? "0 0 0 4px rgba(47,128,237,0.08)" : "none",
          color: "#0B1F3A",
          transition: "all 0.2s ease",
        }}
        placeholder={placeholder}
        onFocus={() => onFocus(name)}
        onBlur={onBlur}
      />
      {error && <p className="mt-1.5 text-xs font-semibold" style={{ color: "#EB5757" }}>{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs" style={{ color: "#94a3b8" }}>{hint}</p>}
    </div>
  );
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

// ─── Nav buttons ──────────────────────────────────────────────────
const NavButtons = ({ step, onBack, loading, isLast }) => (
  <div className={`flex gap-3 pt-2 ${step > 1 ? "justify-between" : "justify-end"}`}>
    {step > 1 && (
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold transition-all duration-200 hover:scale-[1.02]"
        style={{
          background: "linear-gradient(#F5F9FF, #F5F9FF) padding-box, linear-gradient(135deg, #2F80ED, #56CCF2) border-box",
          border: "1.5px solid transparent",
          color: "#2F80ED",
        }}
      >
        <ArrowLeft size={15} />
        Back
      </button>
    )}
    <button
      type="submit"
      disabled={loading}
      className="group relative flex-1 overflow-hidden rounded-xl py-3.5 text-sm font-extrabold text-white transition-all duration-300 hover:scale-[1.015] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        background: "linear-gradient(135deg, #2F80ED 0%, #56CCF2 100%)",
        boxShadow: "0 8px 32px rgba(47,128,237,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
      }}
    >
      <span
        className="pointer-events-none absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)" }}
      />
      <span className="relative flex items-center justify-center gap-2">
        {loading ? "Submitting Profile…" : isLast ? "Submit for Review" : "Continue"}
        {!loading && (isLast
          ? <CheckCircle2 size={15} />
          : <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
        )}
      </span>
    </button>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────
const RegisterDoctorForm = ({ onSubmit, loading }) => {
  const maxFileSizeBytes = 10 * 1024 * 1024;
  const [step, setStep] = useState(1);
  const [focused, setFocused] = useState(null);
  const [verificationFiles, setVerificationFiles] = useState([]);
  const [filesError, setFilesError] = useState("");
  const fileInputRef = useRef(null);

  const {
    register,
    control,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(doctorRegisterSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      medicalLicenseNumber: "",
      specialization: "",
      yearsOfExperience: "",
      verificationLinksInput: "",
    },
    mode: "onTouched",
  });

  const password = useWatch({ control, name: "password" }) || "";
  const verificationLinksInput = useWatch({ control, name: "verificationLinksInput" }) || "";

  const stepFields = {
    1: ["fullName", "email", "phone"],
    2: ["medicalLicenseNumber", "specialization", "yearsOfExperience"],
    3: ["verificationLinksInput", "password", "confirmPassword"],
  };

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
      const fileMap = new Map(
        currentFiles.map((file) => [
          `${file.name}-${file.size}-${file.lastModified}`,
          file
        ])
      );

      for (const file of supportedFiles) {
        fileMap.set(`${file.name}-${file.size}-${file.lastModified}`, file);
      }

      const oversizedFile = supportedFiles.find((file) => file.size > maxFileSizeBytes);

      if (oversizedFile) {
        setFilesError(`${oversizedFile.name} is larger than 10 MB.`);
        return currentFiles;
      }

      const nextFiles = Array.from(fileMap.values()).slice(0, 5);

      if (fileMap.size > 5) {
        setFilesError("You can upload up to 5 files.");
      } else {
        setFilesError("");
      }

      return nextFiles;
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

  const handleNext = async () => {
    const valid = await trigger(stepFields[step]);

    if (!valid) {
      return;
    }

    if (step === 3 && !verificationFiles.length && !verificationLinks.length) {
      setFilesError("Add at least one verification file or one supporting link.");
      return;
    }

    setFilesError("");
    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  const fieldProps = { register, errors, focused, onFocus: setFocused, onBlur: () => setFocused(null) };
  const handleFinalSubmit = handleSubmit((values) => {
    if (!verificationFiles.length && !values.verificationLinks.length) {
      setFilesError("Add at least one verification file or one supporting link.");
      return;
    }

    setFilesError("");
    onSubmit({
      ...values,
      verificationFiles
    });
  });

  return (
    <div>
      <StepBar current={step} />

      <form
        className="space-y-5"
        onSubmit={step < steps.length
          ? (e) => { e.preventDefault(); handleNext(); }
          : handleFinalSubmit
        }
      >
        {/* Step 1 — Personal Info */}
        {step === 1 && (
          <div className="space-y-4">
            <Field label="Full Name" icon={User} name="fullName" type="text" placeholder="Dr. Nimal Perera"
              {...fieldProps} error={errors.fullName?.message} />
            <Field label="Email Address" icon={Mail} name="email" type="email" placeholder="doctor@example.com"
              {...fieldProps} error={errors.email?.message} />
            <Field label="Phone Number" icon={Phone} name="phone" type="tel" placeholder="0711234567"
              {...fieldProps} error={errors.phone?.message} />
          </div>
        )}

        {/* Step 2 — Clinical Details */}
        {step === 2 && (
          <div className="space-y-4">
            <Field label="Medical License No." icon={Award} name="medicalLicenseNumber" placeholder="SLMC-12345"
              {...fieldProps} error={errors.medicalLicenseNumber?.message}
              hint="Your Sri Lanka Medical Council license number" />
            <Field label="Specialization" icon={Stethoscope} name="specialization" placeholder="e.g. Cardiology, Pediatrics"
              {...fieldProps} error={errors.specialization?.message} />
            <Field label="Years of Experience" icon={Clock3} name="yearsOfExperience" type="number" placeholder="e.g. 8"
              {...fieldProps} error={errors.yearsOfExperience?.message} />
          </div>
        )}

        {/* Step 3 — Account Security */}
        {step === 3 && (
          <div className="space-y-4">
            <div
              className="rounded-[24px] p-4"
              style={{
                background: "linear-gradient(180deg, rgba(47,128,237,0.06) 0%, rgba(86,204,242,0.05) 100%)",
                border: "1px solid rgba(47,128,237,0.12)"
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-2xl"
                  style={{ background: "rgba(47,128,237,0.12)" }}
                >
                  <FileBadge2 size={18} style={{ color: "#2F80ED" }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-extrabold uppercase tracking-widest" style={{ color: "#0B1F3A" }}>
                    Verification Files
                  </p>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: "#64748b" }}>
                    Upload certificates, scanned documents, or clear images. PDF, JPG, PNG, DOC,
                    and DOCX are accepted.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 flex w-full flex-col items-center justify-center rounded-[22px] border border-dashed px-4 py-6 text-center transition-all duration-200 hover:scale-[1.01]"
                style={{
                  borderColor: "rgba(47,128,237,0.24)",
                  background: "rgba(255,255,255,0.45)"
                }}
              >
                <Upload size={22} style={{ color: "#2F80ED" }} />
                <p className="mt-3 text-sm font-bold" style={{ color: "#0B1F3A" }}>
                  Select verification files
                </p>
                <p className="mt-1 text-xs" style={{ color: "#64748b" }}>
                  Up to 5 files, 10 MB each
                </p>
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
                      className="flex items-center justify-between rounded-2xl px-4 py-3"
                      style={{
                        background: "rgba(255,255,255,0.6)",
                        border: "1px solid rgba(47,128,237,0.1)"
                      }}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold" style={{ color: "#0B1F3A" }}>
                          {file.name}
                        </p>
                        <p className="mt-1 text-xs" style={{ color: "#64748b" }}>
                          {file.type || "Document"} • {formatFileSize(file.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(file)}
                        className="ml-3 rounded-full p-2 transition-colors hover:bg-slate-200/70"
                        style={{ color: "#475569" }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest" style={{ color: "#334155" }}>
                <Link2 size={11} style={{ color: "#2F80ED" }} />
                Supporting Links
              </label>
              <textarea
                {...register("verificationLinksInput")}
                rows={4}
                className="w-full rounded-xl px-4 py-3.5 text-sm outline-none"
                style={{
                  background: focused === "verificationLinksInput" ? "rgba(47,128,237,0.05)" : "rgba(11,31,58,0.03)",
                  border: focused === "verificationLinksInput"
                    ? "1.5px solid rgba(47,128,237,0.5)"
                    : "1.5px solid rgba(47,128,237,0.15)",
                  boxShadow: focused === "verificationLinksInput" ? "0 0 0 4px rgba(47,128,237,0.08)" : "none",
                  color: "#0B1F3A",
                  transition: "all 0.2s ease",
                  resize: "vertical"
                }}
                placeholder={"https://example.com/certificate\nhttps://example.com/profile"}
                onFocus={() => setFocused("verificationLinksInput")}
                onBlur={() => setFocused(null)}
              />
              {errors.verificationLinksInput?.message ? (
                <p className="mt-1.5 text-xs font-semibold" style={{ color: "#EB5757" }}>
                  {errors.verificationLinksInput.message}
                </p>
              ) : (
                <p className="mt-1.5 text-xs" style={{ color: "#94a3b8" }}>
                  Optional. Add one URL per line if you want to share license registry or portfolio links.
                </p>
              )}
            </div>

            {filesError ? (
              <p className="text-xs font-semibold" style={{ color: "#EB5757" }}>
                {filesError}
              </p>
            ) : null}

            {(verificationFiles.length || verificationLinks.length) ? (
              <div
                className="rounded-xl p-3"
                style={{ background: "rgba(47,128,237,0.05)", border: "1px solid rgba(47,128,237,0.12)" }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "#2F80ED" }}>
                  Submission Summary
                </p>
                <p className="mt-2 text-sm" style={{ color: "#475569" }}>
                  {verificationFiles.length} file{verificationFiles.length === 1 ? "" : "s"} selected
                  {verificationLinks.length ? ` and ${verificationLinks.length} supporting link${verificationLinks.length === 1 ? "" : "s"}` : ""}.
                </p>
              </div>
            ) : null}

            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: "rgba(47,128,237,0.05)", border: "1px solid rgba(47,128,237,0.12)" }}
            >
              <div className="h-1.5 w-1.5 rounded-full bg-[#2F80ED] mt-1.5 flex-shrink-0 animate-pulse" />
              <p className="text-xs leading-relaxed" style={{ color: "#475569" }}>
                Your profile will be reviewed by an administrator before you can access patient consultations.
              </p>
            </div>

            <Field label="Create Password" icon={Lock} name="password" type="password"
              placeholder="Create a strong password"
              {...fieldProps} error={errors.password?.message} />
            <PasswordStrengthHint value={password} />
            <Field label="Confirm Password" icon={ShieldCheck} name="confirmPassword" type="password"
              placeholder="Confirm your password"
              {...fieldProps} error={errors.confirmPassword?.message} />
          </div>
        )}

        <NavButtons step={step} onBack={handleBack} loading={loading} isLast={step === steps.length} />
      </form>
    </div>
  );
};

export default RegisterDoctorForm;
