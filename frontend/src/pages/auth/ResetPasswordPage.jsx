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
      title="Create a fresh password"
      description="Enter your reset code and choose a new password for your account."
      footer={
        <p className="text-sm text-slate-600">
          Need a new OTP?{" "}
          <Link to="/forgot-password" className="font-semibold text-cyan-700">
            Send another one
          </Link>
        </p>
      }
    >
      <ResetPasswordForm defaultEmail={email} onSubmit={handleSubmit} loading={loading} />
    </AuthLayout>
  );
};

export default ResetPasswordPage;
