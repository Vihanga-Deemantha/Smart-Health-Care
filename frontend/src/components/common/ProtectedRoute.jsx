import { Navigate, useLocation } from "react-router-dom";
import LoadingSpinner from "./LoadingSpinner.jsx";
import { useAuth } from "../../hooks/useAuth.js";

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { initialized, loading, isAuthenticated } = useAuth();

  if (!initialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <LoadingSpinner label="Restoring your session" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
