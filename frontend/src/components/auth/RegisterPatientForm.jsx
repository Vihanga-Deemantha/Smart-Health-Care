import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User, Mail, Phone, Lock, ShieldCheck,
  ArrowRight, ArrowLeft, CheckCircle2, CreditCard,
  UserCircle2, KeyRound
} from "lucide-react";
import { patientRegisterSchema } from "../../schemas/auth.schema.js";
import PasswordStrengthHint from "./PasswordStrengthHint.jsx";

// ─── Step progress bar ────────────────────────────────────────────
const steps = [
  { id: 1, label: "Personal Info",  icon: UserCircle2 },
  { id: 2, label: "Set Password",   icon: KeyRound },
];

const StepBar = ({ current, total }) => (
  <div className="mb-8">
    {/* Segmented progress bar */}
    <div className="flex gap-1.5 mb-4">
      {Array.from({ length: total }, (_, i) => (
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
    {/* Step labels */}
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#2F80ED" }}>
          Step {current} of {total}
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
                border: active ? "none" : done ? "none" : "1.5px solid rgba(47,128,237,0.2)",
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
const Field = ({ label, icon, name, type = "text", placeholder, register, error, focused, onFocus, onBlur }) => {
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
    </div>
  );
};

const IdentityOption = ({ active, label, description, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="rounded-2xl px-4 py-3 text-left transition-all duration-200"
    style={{
      background: active ? "rgba(47,128,237,0.12)" : "rgba(11,31,58,0.03)",
      border: active
        ? "1.5px solid rgba(47,128,237,0.4)"
        : "1.5px solid rgba(47,128,237,0.12)",
      boxShadow: active ? "0 12px 24px rgba(47,128,237,0.12)" : "none"
    }}
  >
    <p className="text-sm font-bold" style={{ color: "#0B1F3A" }}>
      {label}
    </p>
    <p className="mt-1 text-xs leading-relaxed" style={{ color: "#64748b" }}>
      {description}
    </p>
  </button>
);

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
        {loading ? "Creating Account…" : isLast ? "Create Healio Account" : "Continue"}
        {!loading && (isLast
          ? <CheckCircle2 size={15} />
          : <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
        )}
      </span>
    </button>
  </div>
);

// ─── Main Form Component ──────────────────────────────────────────
const RegisterPatientForm = ({ onSubmit, loading }) => {
  const [step, setStep] = useState(1);
  const [focused, setFocused] = useState(null);

  const {
    register,
    control,
    handleSubmit,
    trigger,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(patientRegisterSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      identityType: undefined,
      nic: "",
      passportNumber: "",
      nationality: ""
    },
    mode: "onTouched",
  });

  const password = useWatch({ control, name: "password" }) || "";
  const identityType = useWatch({ control, name: "identityType" });

  const handleIdentityTypeChange = (nextType) => {
    const resolvedType = identityType === nextType ? undefined : nextType;

    setValue("identityType", resolvedType, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });

    if (resolvedType === "NIC") {
      setValue("passportNumber", "", { shouldDirty: true });
      setValue("nationality", "", { shouldDirty: true });
      clearErrors(["passportNumber", "nationality"]);
    }

    if (resolvedType === "PASSPORT") {
      setValue("nic", "", { shouldDirty: true });
      clearErrors(["nic"]);
    }

    if (!resolvedType) {
      setValue("nic", "", { shouldDirty: true });
      setValue("passportNumber", "", { shouldDirty: true });
      setValue("nationality", "", { shouldDirty: true });
      clearErrors(["identityType", "nic", "passportNumber", "nationality"]);
    }
  };

  const handleNext = async () => {
    const fieldsToValidate = step === 1
      ? ["fullName", "email", "phone", "identityType", "nic", "passportNumber", "nationality"]
      : ["password", "confirmPassword"];
    const valid = await trigger(fieldsToValidate);
    if (valid) setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  return (
    <div>
      <StepBar current={step} total={steps.length} />

      <form
        className="space-y-5"
        onSubmit={step < steps.length
          ? (e) => { e.preventDefault(); handleNext(); }
          : handleSubmit(onSubmit)
        }
      >
        {/* Step 1 — Personal Info */}
        <input type="hidden" {...register("identityType")} />
        {step === 1 && (
          <div className="space-y-4">
            <Field
              label="Full Name" icon={User} name="fullName" type="text"
              placeholder="Jane Fernando"
              register={register} error={errors.fullName?.message}
              focused={focused} onFocus={setFocused} onBlur={() => setFocused(null)}
            />
            <Field
              label="Email Address" icon={Mail} name="email" type="email"
              placeholder="jane@example.com"
              register={register} error={errors.email?.message}
              focused={focused} onFocus={setFocused} onBlur={() => setFocused(null)}
            />
            <Field
              label="Phone Number" icon={Phone} name="phone" type="tel"
              placeholder="0771234567"
              register={register} error={errors.phone?.message}
              focused={focused} onFocus={setFocused} onBlur={() => setFocused(null)}
            />
            <div
              className="rounded-[22px] p-4"
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
                  <CreditCard size={18} style={{ color: "#2F80ED" }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-extrabold uppercase tracking-widest" style={{ color: "#0B1F3A" }}>
                    Identification Details
                  </p>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: "#64748b" }}>
                    Optional. Add either your NIC or your passport details to align signup with
                    identity-based registration.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <IdentityOption
                  active={!identityType}
                  label="Skip for now"
                  description="Complete registration first and add identity details later if needed."
                  onClick={() => handleIdentityTypeChange(undefined)}
                />
                <IdentityOption
                  active={identityType === "NIC"}
                  label="NIC Number"
                  description="Use your Sri Lankan national identity card number."
                  onClick={() => handleIdentityTypeChange("NIC")}
                />
                <IdentityOption
                  active={identityType === "PASSPORT"}
                  label="Passport"
                  description="Use your passport number together with nationality."
                  onClick={() => handleIdentityTypeChange("PASSPORT")}
                />
              </div>

              {errors.identityType?.message && (
                <p className="mt-3 text-xs font-semibold" style={{ color: "#EB5757" }}>
                  {errors.identityType.message}
                </p>
              )}

              {identityType === "NIC" && (
                <div className="mt-4">
                  <Field
                    label="NIC Number" icon={CreditCard} name="nic" type="text"
                    placeholder="200012345678 or 901234567V"
                    register={register} error={errors.nic?.message}
                    focused={focused} onFocus={setFocused} onBlur={() => setFocused(null)}
                  />
                </div>
              )}

              {identityType === "PASSPORT" && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Nationality" icon={User} name="nationality" type="text"
                    placeholder="e.g. Sri Lankan"
                    register={register} error={errors.nationality?.message}
                    focused={focused} onFocus={setFocused} onBlur={() => setFocused(null)}
                  />
                  <Field
                    label="Passport Number" icon={CreditCard} name="passportNumber" type="text"
                    placeholder="Enter your passport number"
                    register={register} error={errors.passportNumber?.message}
                    focused={focused} onFocus={setFocused} onBlur={() => setFocused(null)}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2 — Set Password */}
        {step === 2 && (
          <div className="space-y-4">
            <Field
              label="Password" icon={Lock} name="password" type="password"
              placeholder="Create a secure password"
              register={register} error={errors.password?.message}
              focused={focused} onFocus={setFocused} onBlur={() => setFocused(null)}
            />

            <PasswordStrengthHint value={password} />

            <Field
              label="Confirm Password" icon={ShieldCheck} name="confirmPassword" type="password"
              placeholder="Confirm your password"
              register={register} error={errors.confirmPassword?.message}
              focused={focused} onFocus={setFocused} onBlur={() => setFocused(null)}
            />
          </div>
        )}

        <NavButtons
          step={step}
          onBack={handleBack}
          loading={loading}
          isLast={step === steps.length}
        />
      </form>
    </div>
  );
};

export default RegisterPatientForm;
