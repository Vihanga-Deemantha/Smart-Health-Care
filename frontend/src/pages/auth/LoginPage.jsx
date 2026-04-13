import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AuthLayout from "../../components/auth/AuthLayout.jsx";
import LoginForm from "../../components/auth/LoginForm.jsx";
import { loginUser } from "../../services/authApi.js";
import { useAuth } from "../../hooks/useAuth.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";

const getRoleHomePath = (role) => {
  if (role === "ADMIN" || role === "SUPER_ADMIN") {
    return "/admin";
  }

  if (role === "DOCTOR") {
    return "/doctor";
  }

  if (role === "PATIENT") {
    return "/dashboard";
  }

  return "/";
};

const isPathAllowedForRole = (role, path) => {
  if (!path) {
    return false;
  }

  const allowedPrefixesByRole = {
    PATIENT: [
      "/patient",
      "/dashboard",
      "/profile",
      "/reports",
      "/history",
      "/ai-chat",
      "/book-appointment",
      "/checkout",
      "/booking-confirmation"
    ],
    DOCTOR: ["/doctor"],
    ADMIN: ["/admin"],
    SUPER_ADMIN: ["/admin"]
  };

  const allowedPrefixes = allowedPrefixesByRole[role] || [];

  return allowedPrefixes.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
};

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);

    try {
      const response = await loginUser(values);
      const user = response.data?.data?.user;
      const accessToken = response.data?.data?.accessToken;
      const loginMessage = response.data?.data?.loginMessage;

      setAuth(user, accessToken);
      toast.success("Signed in successfully");
      if (loginMessage) {
        toast(loginMessage, {
          icon: "i"
        });
      }

      const roleHomePath = getRoleHomePath(user?.role);
      const requestedPath = location.state?.from?.pathname;

      const nextPath =
        isPathAllowedForRole(user?.role, requestedPath) ? requestedPath : roleHomePath;

      navigate(nextPath, { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to sign in."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      description="Sign in to your Healio account to access your clinical workspace."
      footer={
        <div className="flex items-center justify-between gap-4 text-sm">
          <a href="/forgot-password" className="text-xs font-bold transition-opacity hover:opacity-70" style={{ color: "#2F80ED" }}>
            Forgot password?
          </a>
          <p className="text-xs" style={{ color: "#64748b" }}>
            No account?{" "}
            <a href="/register" className="font-bold" style={{ color: "#2F80ED" }}>
              Register now
            </a>
          </p>
        </div>
      }
    >
      <LoginForm onSubmit={handleSubmit} loading={loading} />
    </AuthLayout>
  );
};

export default LoginPage;
