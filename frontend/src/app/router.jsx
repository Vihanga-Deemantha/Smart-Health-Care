import { createBrowserRouter } from "react-router-dom";
import LandingPage from "../pages/public/LandingPage.jsx";
import LoginPage from "../pages/auth/LoginPage.jsx";
import RegisterPage from "../pages/auth/RegisterPage.jsx";
import VerifyOtpPage from "../pages/auth/VerifyOtpPage.jsx";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage.jsx";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage.jsx";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage.jsx";
import PendingDoctorsPage from "../pages/admin/PendingDoctorsPage.jsx";
import UsersManagementPage from "../pages/admin/UsersManagementPage.jsx";
import SecurityLogsPage from "../pages/admin/SecurityLogsPage.jsx";
import PatientHomePage from "../pages/patient/PatientHomePage.jsx";
<<<<<<< Updated upstream
import DoctorHomePage from "../pages/doctor/DoctorHomePage.jsx";
=======
import PatientAppointmentsPage from "../pages/patient/PatientAppointmentsPage.jsx";
import PatientFindDoctorPage from "../pages/patient/PatientFindDoctorPage.jsx";
import PatientBookingsPage from "../pages/patient/PatientBookingsPage.jsx";
import PatientServiceToolsPage from "../pages/patient/PatientServiceToolsPage.jsx";
import DoctorHomePage from "../pages/doctor/DoctorHomePage.jsx";
import DoctorSearch from "../pages/DoctorSearch.jsx";
import BookAppointment from "../pages/BookAppointment.jsx";
import Checkout from "../pages/Checkout.jsx";
import BookingConfirmation from "../pages/BookingConfirmation.jsx";
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
=======
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
>>>>>>> Stashed changes
  { path: "/unauthorized", element: <UnauthorizedPage /> },
  {
    path: "/patient",
    element: (
      <ProtectedRoute>
        <RoleProtectedRoute allowedRoles={["PATIENT"]}>
          <PatientHomePage />
        </RoleProtectedRoute>
      </ProtectedRoute>
    )
  },
  {
<<<<<<< Updated upstream
=======
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
>>>>>>> Stashed changes
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
        <RoleProtectedRoute allowedRoles={["ADMIN"]}>
          <AdminLayout />
        </RoleProtectedRoute>
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: "doctors/pending", element: <PendingDoctorsPage /> },
      { path: "users", element: <UsersManagementPage /> },
      { path: "security", element: <SecurityLogsPage /> }
    ]
  },
  { path: "*", element: <NotFoundPage /> }
]);
