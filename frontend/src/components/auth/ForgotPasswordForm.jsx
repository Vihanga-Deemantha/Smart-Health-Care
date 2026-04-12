import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "../../schemas/auth.schema.js";
import { Mail, ArrowRight, Info } from "lucide-react";
import { useState } from "react";

const ForgotPasswordForm = ({ onSubmit, loading }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const [focused, setFocused] = useState(false);

  const inputStyle = {
    background: focused ? "rgba(47,128,237,0.05)" : "rgba(11,31,58,0.03)",
    border: focused ? "1.5px solid rgba(47,128,237,0.5)" : "1.5px solid rgba(47,128,237,0.15)",
    boxShadow: focused ? "0 0 0 4px rgba(47,128,237,0.08)" : "none",
    color: "#0B1F3A",
    transition: "all 0.2s ease",
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest" style={{ color: "#334155" }}>
          <Mail size={11} style={{ color: "#2F80ED" }} />
          Registered Email
        </label>
        <input
          {...register("email")}
          type="email"
          className="w-full rounded-xl px-4 py-3.5 text-sm outline-none"
          style={inputStyle}
          placeholder="you@example.com"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {errors.email && <p className="mt-1.5 text-xs font-semibold" style={{ color: "#EB5757" }}>{errors.email.message}</p>}
      </div>

      {/* Info notice */}
      <div
        className="flex items-start gap-3 rounded-xl px-4 py-3.5"
        style={{ background: "rgba(47,128,237,0.06)", border: "1px solid rgba(47,128,237,0.15)" }}
      >
        <Info size={14} className="mt-0.5 flex-shrink-0" style={{ color: "#2F80ED" }} />
        <p className="text-xs leading-relaxed" style={{ color: "#475569" }}>
          We'll send a one-time password to your registered email. Check your inbox and spam folder.
        </p>
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
          {loading ? "Sending OTP…" : "Send Reset OTP"}
          {!loading && <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />}
        </span>
      </button>
    </form>
  );
};

export default ForgotPasswordForm;
