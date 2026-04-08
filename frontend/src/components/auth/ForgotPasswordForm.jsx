import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "../../schemas/auth.schema.js";

const ForgotPasswordForm = ({ onSubmit, loading }) => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ""
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

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-linear-to-r from-cyan-400 via-blue-500 to-emerald-400 px-5 py-3.5 text-sm font-semibold text-slate-950 shadow-[0_24px_60px_-28px_rgba(34,211,238,0.75)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Sending OTP..." : "Send password reset OTP"}
      </button>
    </form>
  );
};

export default ForgotPasswordForm;
