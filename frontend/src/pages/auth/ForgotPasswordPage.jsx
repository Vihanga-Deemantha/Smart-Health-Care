import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import AuthLayout from "../../components/auth/AuthLayout.jsx";
import ForgotPasswordForm from "../../components/auth/ForgotPasswordForm.jsx";
import { forgotPassword } from "../../services/authApi.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);

    try {
      await forgotPassword(values);
      toast.success("Password reset OTP sent");
      navigate(`/reset-password?email=${encodeURIComponent(values.email)}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to send password reset OTP."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Your Password"
      description="Enter your registered email and we'll send you a one-time code to reset your Healio password."
      footer={
        <p className="text-xs" style={{ color: "#64748b" }}>
          Remembered it?{" "}
          <a href="/login" className="font-bold" style={{ color: "#2F80ED" }}>
            Back to sign in
          </a>
        </p>
      }
    >
      <ForgotPasswordForm onSubmit={handleSubmit} loading={loading} />
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
