import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { verifyOtpSchema } from "../../schemas/auth.schema.js";

const OtpVerificationForm = ({ defaultEmail = "", onSubmit, onResend, resendLabel, loading }) => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: {
      email: defaultEmail,
      otpCode: ""
    }
  });

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
        <label className="mb-2 block text-sm font-medium text-slate-700">Verification code</label>
        <input
          {...register("otpCode")}
          maxLength={6}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center text-2xl font-semibold tracking-[0.55em] text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
          placeholder="123456"
        />
        {errors.otpCode ? <p className="mt-2 text-xs text-rose-600">{errors.otpCode.message}</p> : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-100 p-4 text-sm text-slate-600">
        <span>Need another OTP?</span>
        <button
          type="button"
          onClick={onResend}
          className="font-semibold text-cyan-700"
        >
          {resendLabel}
        </button>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-linear-to-r from-cyan-400 via-blue-500 to-emerald-400 px-5 py-3.5 text-sm font-semibold text-slate-950 shadow-[0_24px_60px_-28px_rgba(34,211,238,0.75)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Verifying..." : "Verify email OTP"}
      </button>
    </form>
  );
};

export default OtpVerificationForm;
