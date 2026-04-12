import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import AuthLayout from "../../components/auth/AuthLayout.jsx";
import ResetPasswordForm from "../../components/auth/ResetPasswordForm.jsx";
import { resetPassword } from "../../services/authApi.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const email = searchParams.get("email") || "";

  const handleSubmit = async (values) => {
    setLoading(true);

    try {
      await resetPassword({
        email: values.email,
        otpCode: values.otpCode,
        newPassword: values.newPassword
      });
      toast.success("Password reset successfully");
      navigate("/login");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to reset password."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create a New Password"
      description="Enter your OTP code and choose a new secure password for your Healio account."
      footer={
        <p className="text-xs" style={{ color: "#64748b" }}>
          Need a new OTP?{" "}
          <a href="/forgot-password" className="font-bold" style={{ color: "#2F80ED" }}>
            Send another
          </a>
        </p>
      }
    >
      <ResetPasswordForm defaultEmail={email} onSubmit={handleSubmit} loading={loading} />
    </AuthLayout>
  );
};

export default ResetPasswordPage;
