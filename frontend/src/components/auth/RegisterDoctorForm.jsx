import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { doctorRegisterSchema } from "../../schemas/auth.schema.js";
import PasswordStrengthHint from "./PasswordStrengthHint.jsx";

const RegisterDoctorForm = ({ onSubmit, loading }) => {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors }
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
      yearsOfExperience: 0,
      qualificationDocuments: ""
    }
  });

  const password = useWatch({ control, name: "password" }) || "";

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-5 sm:grid-cols-2">
        {[
          ["fullName", "Full name", "Dr Nimal Perera"],
          ["email", "Email", "doctor@example.com"],
          ["phone", "Phone", "0711234567"],
          ["medicalLicenseNumber", "Medical license", "SLMC-12345"],
          ["specialization", "Specialization", "Cardiology"],
          ["yearsOfExperience", "Years of experience", "5"]
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
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Qualification documents
        </label>
        <input
          {...register("qualificationDocuments")}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
          placeholder="Comma-separated document names or links"
        />
        {errors.qualificationDocuments ? (
          <p className="mt-2 text-xs text-rose-600">{errors.qualificationDocuments.message}</p>
        ) : (
          <p className="mt-2 text-xs text-slate-500">
            For now, enter document names or URLs separated by commas.
          </p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
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
      </div>

      <PasswordStrengthHint value={password} />

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-linear-to-r from-cyan-400 via-blue-500 to-emerald-400 px-5 py-3.5 text-sm font-semibold text-slate-950 shadow-[0_24px_60px_-28px_rgba(34,211,238,0.75)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Submitting profile..." : "Register as doctor"}
      </button>
    </form>
  );
};

export default RegisterDoctorForm;
