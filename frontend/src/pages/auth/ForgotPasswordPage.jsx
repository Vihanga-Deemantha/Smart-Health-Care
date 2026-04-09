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
      title="Reset your password"
      description="We will send a one-time code so you can create a new password."
      footer={
        <p className="text-sm text-slate-600">
          Remembered your password?{" "}
          <Link to="/login" className="font-semibold text-cyan-700">
            Back to sign in
          </Link>
        </p>
      }
    >
      <ForgotPasswordForm onSubmit={handleSubmit} loading={loading} />
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
