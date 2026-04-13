import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { verifyOtpSchema } from "../../schemas/auth.schema.js";
import { Mail, ShieldCheck, RefreshCw, ArrowRight } from "lucide-react";
import { useState } from "react";

const OtpVerificationForm = ({ defaultEmail = "", onSubmit, onResend, resendLabel, loading }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { email: defaultEmail, otpCode: "" },
  });

  const [focused, setFocused] = useState(null);

  const fieldStyle = (name) => ({
    background: focused === name ? "rgba(47,128,237,0.05)" : "rgba(11,31,58,0.03)",
    border: focused === name ? "1.5px solid rgba(47,128,237,0.5)" : "1.5px solid rgba(47,128,237,0.15)",
    boxShadow: focused === name ? "0 0 0 4px rgba(47,128,237,0.08)" : "none",
    color: "#0B1F3A",
    transition: "all 0.2s ease",
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      {/* Email */}
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest" style={{ color: "#334155" }}>
          <Mail size={11} style={{ color: "#2F80ED" }} />
          Email Address
        </label>
        <input
          {...register("email")}
          className="w-full rounded-xl px-4 py-3.5 text-sm outline-none"
          style={fieldStyle("email")}
          placeholder="you@example.com"
          onFocus={() => setFocused("email")}
          onBlur={() => setFocused(null)}
        />
        {errors.email && <p className="mt-1.5 text-xs font-semibold" style={{ color: "#EB5757" }}>{errors.email.message}</p>}
      </div>

      {/* OTP — large centered input */}
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest" style={{ color: "#334155" }}>
          <ShieldCheck size={11} style={{ color: "#2F80ED" }} />
          Verification Code
        </label>
        <input
          {...register("otpCode")}
          maxLength={6}
          inputMode="numeric"
          className="w-full rounded-xl text-center text-4xl font-black outline-none tracking-[0.6em]"
          style={{
            ...fieldStyle("otpCode"),
            paddingTop: "18px",
            paddingBottom: "18px",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "0.55em",
            background: focused === "otpCode" ? "rgba(47,128,237,0.06)" : "rgba(47,128,237,0.03)",
            border: focused === "otpCode"
              ? "2px solid rgba(47,128,237,0.5)"
              : "2px solid rgba(47,128,237,0.2)",
            boxShadow: focused === "otpCode" ? "0 0 0 4px rgba(47,128,237,0.08)" : "none",
          }}
          placeholder="______"
          onFocus={() => setFocused("otpCode")}
          onBlur={() => setFocused(null)}
        />
        {errors.otpCode && <p className="mt-1.5 text-xs font-semibold" style={{ color: "#EB5757" }}>{errors.otpCode.message}</p>}
        <p className="mt-2 text-center text-xs" style={{ color: "#94a3b8" }}>Enter the 6-digit code sent to your inbox</p>
      </div>

      {/* Resend row */}
      <div
        className="flex items-center justify-between rounded-xl px-4 py-3"
        style={{ background: "rgba(47,128,237,0.05)", border: "1px solid rgba(47,128,237,0.12)" }}
      >
        <p className="text-xs" style={{ color: "#64748b" }}>Didn't receive the code?</p>
        <button
          type="button"
          onClick={onResend}
          className="flex items-center gap-1.5 text-xs font-bold transition-opacity hover:opacity-70"
          style={{ color: "#2F80ED" }}
        >
          <RefreshCw size={11} />
          {resendLabel}
        </button>
      </div>

      {/* Submit */}
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
          {loading ? "Verifying…" : "Verify & Continue"}
          {!loading && <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />}
        </span>
      </button>
    </form>
  );
};

export default OtpVerificationForm;
