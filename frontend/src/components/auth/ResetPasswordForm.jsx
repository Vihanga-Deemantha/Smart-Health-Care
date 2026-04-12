import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "../../schemas/auth.schema.js";
import PasswordStrengthHint from "./PasswordStrengthHint.jsx";
import { Mail, Key, Lock, ShieldCheck, ArrowRight } from "lucide-react";
import { useState } from "react";

const ResetPasswordForm = ({ defaultEmail = "", onSubmit, loading }) => {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: defaultEmail, otpCode: "", newPassword: "", confirmPassword: "" },
  });

  const password = useWatch({ control, name: "newPassword" }) || "";
  const [focused, setFocused] = useState(null);

  const fieldStyle = (name) => ({
    background: focused === name ? "rgba(47,128,237,0.05)" : "rgba(11,31,58,0.03)",
    border: focused === name ? "1.5px solid rgba(47,128,237,0.5)" : "1.5px solid rgba(47,128,237,0.15)",
    boxShadow: focused === name ? "0 0 0 4px rgba(47,128,237,0.08)" : "none",
    color: "#0B1F3A",
    transition: "all 0.2s ease",
  });

  const fields = [
    { name: "email",           label: "Email Address",   icon: Mail,        type: "email",    ph: "you@example.com" },
    { name: "otpCode",         label: "OTP Code",        icon: Key,         type: "text",     ph: "Enter your 6-digit OTP" },
    { name: "newPassword",     label: "New Password",    icon: Lock,        type: "password", ph: "Create a strong password" },
  ];

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      {fields.map(({ name, label, icon: Icon, type, ph }) => (
        <div key={name}>
          <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest" style={{ color: "#334155" }}>
            <Icon size={11} style={{ color: "#2F80ED" }} />
            {label}
          </label>
          <input
            {...register(name)}
            type={type}
            className="w-full rounded-xl px-4 py-3.5 text-sm outline-none"
            style={fieldStyle(name)}
            placeholder={ph}
            onFocus={() => setFocused(name)}
            onBlur={() => setFocused(null)}
          />
          {errors[name] && <p className="mt-1.5 text-xs font-semibold" style={{ color: "#EB5757" }}>{errors[name].message}</p>}
          {/* Only show strength hint after password field */}
          {name === "newPassword" && <div className="mt-3"><PasswordStrengthHint value={password} /></div>}
        </div>
      ))}

      {/* Confirm password */}
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest" style={{ color: "#334155" }}>
          <ShieldCheck size={11} style={{ color: "#2F80ED" }} />
          Confirm Password
        </label>
        <input
          {...register("confirmPassword")}
          type="password"
          className="w-full rounded-xl px-4 py-3.5 text-sm outline-none"
          style={fieldStyle("confirmPassword")}
          placeholder="Confirm your new password"
          onFocus={() => setFocused("confirmPassword")}
          onBlur={() => setFocused(null)}
        />
        {errors.confirmPassword && <p className="mt-1.5 text-xs font-semibold" style={{ color: "#EB5757" }}>{errors.confirmPassword.message}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="group relative w-full overflow-hidden rounded-xl py-4 text-sm font-extrabold text-white transition-all duration-300 hover:scale-[1.015] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        style={{
          background: "linear-gradient(135deg, #2F80ED 0%, #56CCF2 100%)",
          boxShadow: "0 8px 32px rgba(47,128,237,0.45), inset 0 1px 0 rgba(255,255,255,0.2)",
        }}
      >
        <span
          className="pointer-events-none absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)" }}
        />
        <span className="relative flex items-center justify-center gap-2">
          {loading ? "Resetting…" : "Reset Password"}
          {!loading && <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />}
        </span>
      </button>
    </form>
  );
};

export default ResetPasswordForm;
