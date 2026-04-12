import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import AuthLayout from "../../components/auth/AuthLayout.jsx";
import OtpVerificationForm from "../../components/auth/OtpVerificationForm.jsx";
import { resendEmailOtp, verifyEmailOtp } from "../../services/authApi.js";
import { useCountdown } from "../../hooks/useCountdown.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";

const VerifyOtpPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const { secondsLeft, display, start } = useCountdown(0);
  const email = searchParams.get("email") || "";

  const handleVerify = async (values) => {
    setLoading(true);
    try {
      await verifyEmailOtp(values);
      toast.success("Email verified successfully");
      navigate("/login");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to verify OTP."));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (secondsLeft > 0) return;

    try {
      await resendEmailOtp({ email });
      toast.success("OTP resent successfully");
      start(60);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to resend OTP."));
    }
  };

  return (
    <AuthLayout
      title="Verify Your Email"
      description="Enter the 6-digit code we sent to your email address to activate your Healio account."
      footer={
        <p className="text-xs" style={{ color: "#64748b" }}>
          Need to start over?{" "}
          <a href="/register" className="font-bold" style={{ color: "#2F80ED" }}>
            Back to registration
          </a>
        </p>
      }
    >
      <OtpVerificationForm
        defaultEmail={email}
        onSubmit={handleVerify}
        onResend={handleResend}
        resendLabel={secondsLeft > 0 ? `Resend in ${display}` : "Resend OTP"}
        loading={loading}
      />
    </AuthLayout>
  );
};

export default VerifyOtpPage;
