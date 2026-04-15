import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
        password: values.password,
        identityType: values.identityType,
        nic: values.nic,
        passportNumber: values.passportNumber,
        nationality: values.nationality
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
        verificationLinks: values.verificationLinks,
        verificationFiles: values.verificationFiles
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
      title="Create Your Account"
      description="Join Healio as a patient or doctor to access your secure clinical workspace."
      footer={
        <p className="text-xs" style={{ color: "#64748b" }}>
          Already have an account?{" "}
          <a href="/login" className="font-bold" style={{ color: "#2F80ED" }}>
            Sign in
          </a>
        </p>
      }
    >
      {/* Role Tab Switcher */}
      <div
        className="mb-6 grid grid-cols-2 rounded-xl p-1"
        style={{ background: "rgba(47,128,237,0.06)", border: "1px solid rgba(47,128,237,0.12)" }}
      >
        {[
          ["PATIENT", "Patient"],
          ["DOCTOR", "Doctor"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className="rounded-lg px-4 py-2.5 text-sm font-bold transition-all duration-200"
            style={{
              background: tab === value ? "linear-gradient(135deg, #2F80ED, #56CCF2)" : "transparent",
              color: tab === value ? "white" : "#64748b",
              boxShadow: tab === value ? "0 4px 14px rgba(47,128,237,0.3)" : "none",
            }}
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
