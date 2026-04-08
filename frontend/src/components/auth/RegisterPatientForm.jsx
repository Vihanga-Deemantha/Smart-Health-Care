import { useWatch, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { patientRegisterSchema } from "../../schemas/auth.schema.js";
import PasswordStrengthHint from "./PasswordStrengthHint.jsx";

const RegisterPatientForm = ({ onSubmit, loading }) => {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(patientRegisterSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: ""
    }
  });

  const password = useWatch({ control, name: "password" }) || "";

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      {[
        ["fullName", "Full name", "Jane Fernando"],
        ["email", "Email", "jane@example.com"],
        ["phone", "Phone", "0771234567"]
      ].map(([name, label, placeholder]) => (
        <div key={name}>
          <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
          <input
            {...register(name)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
            placeholder={placeholder}
          />
          {errors[name] ? <p className="mt-2 text-xs text-rose-600">{errors[name].message}</p> : null}
        </div>
      ))}

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
        <input
          {...register("password")}
          type="password"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
          placeholder="Create a secure password"
        />
        {errors.password ? <p className="mt-2 text-xs text-rose-600">{errors.password.message}</p> : null}
      </div>

      <PasswordStrengthHint value={password} />

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Confirm password</label>
        <input
          {...register("confirmPassword")}
          type="password"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
          placeholder="Confirm your password"
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
        {loading ? "Creating account..." : "Register as patient"}
      </button>
    </form>
  );
};

export default RegisterPatientForm;
