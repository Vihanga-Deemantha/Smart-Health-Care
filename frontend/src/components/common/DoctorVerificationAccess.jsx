import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";

const restrictedStatuses = ["PENDING", "CHANGES_REQUESTED", "REJECTED"];
const verificationPath = "/doctor/verification/resubmit";
const dashboardPath = "/doctor/dashboard";

const DoctorVerificationAccess = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();

  if (user?.role !== "DOCTOR") {
    return children;
  }

  const status = user.doctorVerificationStatus;

  if (restrictedStatuses.includes(status) && location.pathname !== verificationPath) {
    return <Navigate to={verificationPath} replace state={{ from: location }} />;
  }

  if (status === "APPROVED" && location.pathname === verificationPath) {
    return <Navigate to={dashboardPath} replace />;
  }

  return children;
};

export default DoctorVerificationAccess;
