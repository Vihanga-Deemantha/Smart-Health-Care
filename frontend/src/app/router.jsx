import { Navigate, createBrowserRouter } from "react-router-dom";
import LandingPage from "../pages/public/LandingPage.jsx";
import LoginPage from "../pages/auth/LoginPage.jsx";
import RegisterPage from "../pages/auth/RegisterPage.jsx";
import VerifyOtpPage from "../pages/auth/VerifyOtpPage.jsx";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage.jsx";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage.jsx";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage.jsx";
import AdminManagementPage from "../pages/admin/AdminManagementPage.jsx";
import AdminProfileSettingsPage from "../pages/admin/AdminProfileSettingsPage.jsx";
import PendingDoctorsPage from "../pages/admin/PendingDoctorsPage.jsx";
import UsersManagementPage from "../pages/admin/UsersManagementPage.jsx";
import SecurityLogsPage from "../pages/admin/SecurityLogsPage.jsx";
import PatientDashboardPage from "../pages/patient/PatientDashboardPage.jsx";
import PatientProfilePage from "../pages/patient/PatientProfilePage.jsx";
import PatientReportsPage from "../pages/patient/PatientReportsPage.jsx";
import PatientHistoryPage from "../pages/patient/PatientHistoryPage.jsx";
import PatientAiChatPage from "../pages/patient/PatientAiChatPage.jsx";
import DoctorHomePage from "../pages/doctor/DoctorHomePage.jsx";
import UnauthorizedPage from "../pages/shared/UnauthorizedPage.jsx";
import NotFoundPage from "../pages/shared/NotFoundPage.jsx";
import ProtectedRoute from "../components/common/ProtectedRoute.jsx";
import RoleProtectedRoute from "../components/common/RoleProtectedRoute.jsx";
import AdminLayout from "../components/admin/AdminLayout.jsx";

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/verify-otp", element: <VerifyOtpPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/unauthorized", element: <UnauthorizedPage /> },
  {
    path: "/patient",
    element: (
      <ProtectedRoute>
        <RoleProtectedRoute allowedRoles={["PATIENT"]}>
          <Navigate to="/dashboard" replace />
        </RoleProtectedRoute>
      </ProtectedRoute>
    )
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <RoleProtectedRoute allowedRoles={["PATIENT"]}>
          <PatientDashboardPage />
        </RoleProtectedRoute>
      </ProtectedRoute>
    )
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <RoleProtectedRoute allowedRoles={["PATIENT"]}>
          <PatientProfilePage />
        </RoleProtectedRoute>
      </ProtectedRoute>
    )
  },
  {
    path: "/reports",
    element: (
      <ProtectedRoute>
        <RoleProtectedRoute allowedRoles={["PATIENT"]}>
          <PatientReportsPage />
        </RoleProtectedRoute>
      </ProtectedRoute>
    )
  },
  {
    path: "/history",
    element: (
      <ProtectedRoute>
        <RoleProtectedRoute allowedRoles={["PATIENT"]}>
          <PatientHistoryPage />
        </RoleProtectedRoute>
      </ProtectedRoute>
    )
  },
  {
    path: "/ai-chat",
    element: (
      <ProtectedRoute>
        <RoleProtectedRoute allowedRoles={["PATIENT"]}>
          <PatientAiChatPage />
        </RoleProtectedRoute>
      </ProtectedRoute>
    )
  },
  {
    path: "/doctor",
    element: (
      <ProtectedRoute>
        <RoleProtectedRoute allowedRoles={["DOCTOR"]}>
          <DoctorHomePage />
        </RoleProtectedRoute>
      </ProtectedRoute>
    )
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <RoleProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
          <AdminLayout />
        </RoleProtectedRoute>
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: "doctors/pending", element: <PendingDoctorsPage /> },
      { path: "users", element: <UsersManagementPage /> },
      { path: "profile", element: <AdminProfileSettingsPage /> },
      {
        path: "admins",
        element: (
          <RoleProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
            <AdminManagementPage />
          </RoleProtectedRoute>
        )
      },
      { path: "security", element: <SecurityLogsPage /> }
    ]
  },
  { path: "*", element: <NotFoundPage /> }
]);
