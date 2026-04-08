import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "../../schemas/auth.schema.js";
import PasswordStrengthHint from "./PasswordStrengthHint.jsx";

const ResetPasswordForm = ({ defaultEmail = "", onSubmit, loading }) => {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: defaultEmail,
      otpCode: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  const password = useWatch({ control, name: "newPassword" }) || "";

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
        <input
          {...register("email")}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
          placeholder="you@example.com"
        />
        {errors.email ? <p className="mt-2 text-xs text-rose-600">{errors.email.message}</p> : null}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">OTP code</label>
        <input
          {...register("otpCode")}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
          placeholder="123456"
        />
        {errors.otpCode ? <p className="mt-2 text-xs text-rose-600">{errors.otpCode.message}</p> : null}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">New password</label>
        <input
          {...register("newPassword")}
          type="password"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
          placeholder="Create a new password"
        />
        {errors.newPassword ? (
          <p className="mt-2 text-xs text-rose-600">{errors.newPassword.message}</p>
        ) : null}
      </div>

      <PasswordStrengthHint value={password} />

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Confirm password</label>
        <input
          {...register("confirmPassword")}
          type="password"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
          placeholder="Confirm your new password"
        />
        {errors.confirmPassword ? (
          <p className="mt-2 text-xs text-rose-600">{errors.confirmPassword.message}</p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-linear-to-r from-cyan-400 via-blue-500 to-emerald-400 px-5 py-3.5 text-sm font-semibold text-slate-950 shadow-[0_24px_60px_-28px_rgba(34,211,238,0.75)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Resetting password..." : "Reset password"}
      </button>
    </form>
  );
};

export default ResetPasswordForm;
