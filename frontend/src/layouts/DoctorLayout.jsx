import {
  CalendarCheck2,
  CalendarClock,
  CheckCircle,
  ClipboardList,
  FileUp,
  LayoutDashboard,
  LogOut,
  UserRound,
  Video
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import PageContainer from "../components/common/PageContainer.jsx";
import { useAuth } from "../hooks/useAuth.js";
import api from "../services/axios.js";

const storeDoctorId = (id) => {
  if (id) {
    localStorage.setItem("doctorId", id);
  }
};

const buildDoctorCreatePayload = (user, userId) => {
  const payload = {
    userId,
    licenseNumber: user.medicalLicenseNumber,
    specialties: user.specialization ? [user.specialization] : [],
    isAvailable: true
  };

  if (user.phone) {
    payload.contactNumber = user.phone;
  }

  const yearsOfExperience = Number(user.yearsOfExperience);
  if (Number.isFinite(yearsOfExperience)) {
    payload.yearsOfExperience = yearsOfExperience;
  }

  return payload;
};

const restrictedNavItems = [
  { label: "Verification", to: "/doctor/verification/resubmit", icon: FileUp }
];

const DoctorLayout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const fullName = localStorage.getItem("fullName") || "";
  const trimmedName = fullName.trim();
  const displayName = trimmedName
    ? /^dr\.?\s+/i.test(trimmedName)
      ? trimmedName
      : `Dr. ${trimmedName}`
    : "Doctor";
  const isRestricted =
    user?.role === "DOCTOR" && user?.doctorVerificationStatus !== "APPROVED";

  const defaultNavItems = [
    { label: "Overview", to: "/doctor/dashboard", icon: LayoutDashboard },
    {
      label: "Pending",
      to: "/doctor/pending",
      icon: ClipboardList,
      badge: pendingCount
    },
    { label: "My Schedule", to: "/doctor/schedule", icon: CalendarClock },
    { label: "Completed History", to: "/doctor/completed", icon: CheckCircle },
    { label: "Video Sessions", to: "/doctor/sessions", icon: Video },
    { label: "Availability", to: "/doctor/availability", icon: CalendarCheck2 },
    { label: "Profile", to: "/doctor/profile", icon: UserRound }
  ];

  const navItems = isRestricted ? restrictedNavItems : defaultNavItems;

  const ensureDoctorProfile = useCallback(async () => {
    if (!user || user.role !== "DOCTOR" || user.doctorVerificationStatus !== "APPROVED") {
      return;
    }

    const storedDoctorId = localStorage.getItem("doctorId");
    if (storedDoctorId) {
      return;
    }

    const storedUserId = localStorage.getItem("userId") || user.id || user._id;
    if (!storedUserId) {
      return;
    }

    try {
      const response = await api.get("/doctors", { params: { userId: storedUserId } });
      const doctors = response.data?.data?.doctors || response.data?.doctors || [];
      const match = doctors.find((doctor) => String(doctor.userId) === String(storedUserId));

      if (match?._id) {
        storeDoctorId(match._id);
        return;
      }

      if (!user.medicalLicenseNumber) {
        return;
      }

      const created = await api.post(
        "/doctors",
        buildDoctorCreatePayload(user, storedUserId)
      );
      const doctor = created.data?.data?.doctor || created.data?.doctor;

      if (doctor?._id) {
        storeDoctorId(doctor._id);
      }
    } catch {
      // Ignore auto-create errors to avoid blocking navigation.
    }
  }, [user]);

  const fetchPendingCount = useCallback(async () => {
    try {
      const response = await api.get("/doctors/appointments", {
        params: { status: "BOOKED" }
      });

      const payload =
        response.data?.data?.appointments ||
        response.data?.appointments ||
        response.data?.data?.items ||
        response.data?.items ||
        response.data?.data ||
        response.data ||
        [];
      const items = Array.isArray(payload) ? payload : payload?.items || [];
      setPendingCount(Array.isArray(items) ? items.length : 0);
    } catch {
      setPendingCount(0);
    }
  }, []);

  useEffect(() => {
    if (!isRestricted) {
      fetchPendingCount();
    }
  }, [fetchPendingCount, isRestricted]);

  useEffect(() => {
    ensureDoctorProfile();
  }, [ensureDoctorProfile]);

  useEffect(() => {
    const handler = (event) => {
      const nextCount = event?.detail?.count;
      if (typeof nextCount === "number") {
        setPendingCount(nextCount);
      }
    };

    window.addEventListener("doctor:pending-count", handler);
    return () => window.removeEventListener("doctor:pending-count", handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("fullName");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen">
        <aside className="w-64 border-r border-slate-800/70 bg-slate-950/80 px-5 py-6">
          <div className="rounded-2xl border border-[#01696f]/30 bg-[#01696f]/10 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7be0e6]">
              Doctor Portal
            </p>
            <p className="mt-2 text-lg font-semibold text-white">{displayName}</p>
            <p className="text-xs text-slate-400">Clinical workspace</p>
          </div>

          <nav className="mt-8 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      isActive
                        ? "bg-[#01696f]/20 text-[#7be0e6] shadow-[0_10px_30px_-20px_rgba(1,105,111,0.9)]"
                        : "text-slate-300 hover:bg-slate-900/60"
                    }`
                  }
                >
                  <Icon size={18} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge ? (
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{ background: "#d29922", color: "#0d1117" }}
                      aria-label={`${item.badge} pending requests`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </NavLink>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-10 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-[#01696f]/40 hover:text-[#7be0e6]"
          >
            <LogOut size={16} />
            Logout
          </button>
        </aside>

        <main className="flex-1">
          <div className="border-b border-slate-800/70 bg-slate-950/70">
            <PageContainer className="py-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Smart Healthcare
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold text-white">
                    Welcome back, {displayName}
                  </h1>
                  {isRestricted ? (
                    <p className="mt-2 text-sm text-amber-300">
                      Verification updates are required before full doctor access is restored.
                    </p>
                  ) : null}
                </div>
                <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">
                  {isRestricted ? "Restricted doctor access" : "Secure access via API Gateway"}
                </div>
              </div>
            </PageContainer>
          </div>

          <PageContainer className="py-8">
            <Outlet />
          </PageContainer>
        </main>
      </div>
    </div>
  );
};

export default DoctorLayout;
