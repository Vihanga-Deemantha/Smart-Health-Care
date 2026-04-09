import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AuthLayout from "../../components/auth/AuthLayout.jsx";
import RegisterPatientForm from "../../components/auth/RegisterPatientForm.jsx";
import RegisterDoctorForm from "../../components/auth/RegisterDoctorForm.jsx";
import { registerDoctor, registerPatient } from "../../services/authApi.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("PATIENT");
  const [loading, setLoading] = useState(false);

  const handlePatientRegister = async (values) => {
    setLoading(true);

    try {
      const response = await registerPatient({
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        password: values.password
      });
      toast.success(
        response.data?.message || "Patient registered. Check your email for the OTP."
      );
      navigate(`/verify-otp?email=${encodeURIComponent(values.email)}`);
    } catch (error) {
      const message = getApiErrorMessage(error, "Unable to register patient.");

      if (
        error?.response?.status === 409 &&
        message.toLowerCase().includes("not verified")
      ) {
        toast.error(message);
        navigate(`/verify-otp?email=${encodeURIComponent(values.email)}`);
        return;
      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorRegister = async (values) => {
    setLoading(true);

    try {
      const response = await registerDoctor({
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        password: values.password,
        medicalLicenseNumber: values.medicalLicenseNumber,
        specialization: values.specialization,
        yearsOfExperience: values.yearsOfExperience,
        qualificationDocuments: values.qualificationDocuments
      });
      toast.success(
        response.data?.message || "Doctor profile submitted. Verify your email next."
      );
      navigate(`/verify-otp?email=${encodeURIComponent(values.email)}`);
    } catch (error) {
      const message = getApiErrorMessage(error, "Unable to register doctor.");

      if (
        error?.response?.status === 409 &&
        message.toLowerCase().includes("not verified")
      ) {
        toast.error(message);
        navigate(`/verify-otp?email=${encodeURIComponent(values.email)}`);
        return;
      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      description="Register as a patient or doctor, then complete email verification before moving into the platform."
      footer={
        <p className="text-sm text-slate-600">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-cyan-700">
            Sign in
          </Link>
        </p>
      }
    >
      <div className="mb-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
        {[
          ["PATIENT", "Patient Registration"],
          ["DOCTOR", "Doctor Registration"]
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              tab === value ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "PATIENT" ? (
        <RegisterPatientForm onSubmit={handlePatientRegister} loading={loading} />
      ) : (
        <RegisterDoctorForm onSubmit={handleDoctorRegister} loading={loading} />
      )}
    </AuthLayout>
  );
};

export default RegisterPage;
