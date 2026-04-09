import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AuthLayout from "../../components/auth/AuthLayout.jsx";
import LoginForm from "../../components/auth/LoginForm.jsx";
import { loginUser } from "../../services/authApi.js";
import { useAuth } from "../../hooks/useAuth.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";

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

      setAuth(user, accessToken);
      toast.success("Signed in successfully");

      const roleHomePath =
        user?.role === "ADMIN"
          ? "/admin"
          : user?.role === "DOCTOR"
            ? "/doctor"
            : user?.role === "PATIENT"
              ? "/patient"
              : "/";

      const nextPath =
        location.state?.from?.pathname || roleHomePath;

      navigate(nextPath, { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to sign in."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to continue with your Smart Care Health account."
      footer={
        <div className="flex items-center justify-between gap-4 text-sm text-slate-600">
          <Link to="/forgot-password" className="font-semibold text-cyan-700">
            Forgot password?
          </Link>
          <p>
            Need an account?{" "}
            <Link to="/register" className="font-semibold text-cyan-700">
              Register now
            </Link>
          </p>
        </div>
      }
    >
      <LoginForm onSubmit={handleSubmit} loading={loading} />
    </AuthLayout>
  );
};

export default LoginPage;
