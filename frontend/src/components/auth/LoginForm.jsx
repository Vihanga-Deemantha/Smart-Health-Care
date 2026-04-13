import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "../../schemas/auth.schema.js";
import { Lock, Mail, ArrowRight } from "lucide-react";
import { useState } from "react";

const LoginForm = ({ onSubmit, loading }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const [focused, setFocused] = useState(null);

  const fieldStyle = (name) => ({
    background: focused === name ? "rgba(47,128,237,0.05)" : "rgba(11,31,58,0.03)",
    border: focused === name
      ? "1.5px solid rgba(47,128,237,0.5)"
      : "1.5px solid rgba(47,128,237,0.15)",
    boxShadow: focused === name ? "0 0 0 4px rgba(47,128,237,0.08)" : "none",
    color: "#0B1F3A",
    transition: "all 0.2s ease",
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      {/* Email */}
      <div>
        <label className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest" style={{ color: "#334155" }}>
          <Mail size={11} style={{ color: "#2F80ED" }} />
          Email Address
        </label>
        <input
          {...register("email")}
          type="email"
          className="w-full rounded-xl px-4 py-3.5 text-sm outline-none"
          style={fieldStyle("email")}
          placeholder="you@example.com"
          onFocus={() => setFocused("email")}
          onBlur={() => setFocused(null)}
        />
        {errors.email && (
          <p className="mt-2 flex items-center gap-1 text-xs font-semibold" style={{ color: "#EB5757" }}>
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <label className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest" style={{ color: "#334155" }}>
          <Lock size={11} style={{ color: "#2F80ED" }} />
          Password
        </label>
        <input
          {...register("password")}
          type="password"
          className="w-full rounded-xl px-4 py-3.5 text-sm outline-none"
          style={fieldStyle("password")}
          placeholder="Enter your password"
          onFocus={() => setFocused("password")}
          onBlur={() => setFocused(null)}
        />
        {errors.password && (
          <p className="mt-2 flex items-center gap-1 text-xs font-semibold" style={{ color: "#EB5757" }}>
            {errors.password.message}
          </p>
        )}
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
        {/* Shimmer */}
        <span
          className="pointer-events-none absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)" }}
        />
        <span className="relative flex items-center justify-center gap-2">
          {loading ? "Signing in…" : "Sign in to Healio"}
          {!loading && <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />}
        </span>
      </button>
    </form>
  );
};

export default LoginForm;
