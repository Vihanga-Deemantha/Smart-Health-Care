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
import PatientHomePage from "../pages/patient/PatientHomePage.jsx";
import PatientDashboardPage from "../pages/patient/PatientDashboardPage.jsx";
import PatientProfilePage from "../pages/patient/PatientProfilePage.jsx";
import PatientReportsPage from "../pages/patient/PatientReportsPage.jsx";
import PatientHistoryPage from "../pages/patient/PatientHistoryPage.jsx";
import PatientAiChatPage from "../pages/patient/PatientAiChatPage.jsx";
import DoctorAvailability from "../pages/doctor/DoctorAvailability.jsx";
import DoctorDashboard from "../pages/doctor/DoctorDashboard.jsx";
import DoctorProfile from "../pages/doctor/DoctorProfile.jsx";
import DoctorTelemedicineSessions from "../pages/doctor/DoctorTelemedicineSessions.jsx";
import PrescriptionForm from "../pages/doctor/PrescriptionForm.jsx";
import VideoConsultation from "../pages/doctor/VideoConsultation.jsx";
import PendingAppointments from "../pages/PendingAppointments.jsx";
import ConfirmedSchedule from "../pages/ConfirmedSchedule.jsx";
import PatientAppointmentsPage from "../pages/patient/PatientAppointmentsPage.jsx";
import PatientFindDoctorPage from "../pages/patient/PatientFindDoctorPage.jsx";
import PatientBookingsPage from "../pages/patient/PatientBookingsPage.jsx";
import PatientServiceToolsPage from "../pages/patient/PatientServiceToolsPage.jsx";
import DoctorSearch from "../pages/DoctorSearch.jsx";
import BookAppointment from "../pages/BookAppointment.jsx";
import Checkout from "../pages/Checkout.jsx";
import BookingConfirmation from "../pages/BookingConfirmation.jsx";
import UnauthorizedPage from "../pages/shared/UnauthorizedPage.jsx";
import NotFoundPage from "../pages/shared/NotFoundPage.jsx";
import ProtectedRoute from "../components/common/ProtectedRoute.jsx";
import RoleProtectedRoute from "../components/common/RoleProtectedRoute.jsx";
import DoctorVerificationAccess from "../components/common/DoctorVerificationAccess.jsx";
import AdminLayout from "../components/admin/AdminLayout.jsx";
import DoctorLayout from "../layouts/DoctorLayout.jsx";
import DoctorVerificationResubmitPage from "../pages/doctor/DoctorVerificationResubmitPage.jsx";

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/verify-otp", element: <VerifyOtpPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/doctor-search", element: <DoctorSearch /> },
  {
    path: "/book-appointment",
    element: (
      <ProtectedRoute>
        <RoleProtectedRoute allowedRoles={["PATIENT"]}>
          <BookAppointment />
        </RoleProtectedRoute>
      </ProtectedRoute>
    )
  },
  {
    path: "/patient/book-appointment",
    element: (
      <ProtectedRoute>
        <RoleProtectedRoute allowedRoles={["PATIENT"]}>
          <BookAppointment />
        </RoleProtectedRoute>
      </ProtectedRoute>
    )
  },
  {
    path: "/checkout",
    element: (
      <ProtectedRoute>
        <RoleProtectedRoute allowedRoles={["PATIENT"]}>
          <Checkout />
        </RoleProtectedRoute>
      </ProtectedRoute>
    )
  },
  {
    path: "/patient/checkout",
    element: (
      <ProtectedRoute>
        <RoleProtectedRoute allowedRoles={["PATIENT"]}>
          <Checkout />
        </RoleProtectedRoute>
      </ProtectedRoute>
    )
  },
  {
    path: "/booking-confirmation",
    element: (
      <ProtectedRoute>
        <RoleProtectedRoute allowedRoles={["PATIENT"]}>
          <BookingConfirmation />
        </RoleProtectedRoute>
      </ProtectedRoute>
    )
  },
  {
    path: "/patient/booking-confirmation",
    element: (
      <ProtectedRoute>
        <RoleProtectedRoute allowedRoles={["PATIENT"]}>
          <BookingConfirmation />
        </RoleProtectedRoute>
      </ProtectedRoute>
    )
  },
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
    path: "/patient/home",
    element: (
      <ProtectedRoute>
        <RoleProtectedRoute allowedRoles={["PATIENT"]}>
          <PatientHomePage />
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
    path: "/patient/appointments",
    element: (
      <ProtectedRoute>
        <RoleProtectedRoute allowedRoles={["PATIENT"]}>
          <PatientAppointmentsPage />
        </RoleProtectedRoute>
      </ProtectedRoute>
    )
  },
  {
    path: "/patient/find-doctor",
    element: (
      <ProtectedRoute>
        <RoleProtectedRoute allowedRoles={["PATIENT"]}>
          <PatientFindDoctorPage />
        </RoleProtectedRoute>
      </ProtectedRoute>
    )
  },
  {
    path: "/patient/bookings",
    element: (
      <ProtectedRoute>
        <RoleProtectedRoute allowedRoles={["PATIENT"]}>
          <PatientBookingsPage />
        </RoleProtectedRoute>
      </ProtectedRoute>
    )
  },
  {
    path: "/patient/tools",
    element: (
      <ProtectedRoute>
        <RoleProtectedRoute allowedRoles={["PATIENT"]}>
          <PatientServiceToolsPage />
        </RoleProtectedRoute>
      </ProtectedRoute>
    )
  },
  {
    path: "/doctor",
    element: (
      <ProtectedRoute>
        <RoleProtectedRoute allowedRoles={["DOCTOR"]}>
          <DoctorVerificationAccess>
            <DoctorLayout />
          </DoctorVerificationAccess>
        </RoleProtectedRoute>
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/doctor/dashboard" replace /> },
      { path: "dashboard", element: <DoctorDashboard /> },
      { path: "pending", element: <PendingAppointments /> },
      { path: "schedule", element: <ConfirmedSchedule /> },
      { path: "sessions", element: <DoctorTelemedicineSessions /> },
      { path: "availability", element: <DoctorAvailability /> },
      { path: "profile", element: <DoctorProfile /> },
      { path: "verification/resubmit", element: <DoctorVerificationResubmitPage /> },
      { path: "consultation/:appointmentId", element: <VideoConsultation /> },
      { path: "prescription/:appointmentId", element: <PrescriptionForm /> }
    ]
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
