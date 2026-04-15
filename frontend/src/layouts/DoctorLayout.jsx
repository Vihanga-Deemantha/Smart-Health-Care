import { CalendarCheck2, LayoutDashboard, LogOut, UserRound } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import PageContainer from "../components/common/PageContainer.jsx";

const navItems = [
  { label: "Dashboard", to: "/doctor/dashboard", icon: LayoutDashboard },
  { label: "Availability", to: "/doctor/availability", icon: CalendarCheck2 },
  { label: "Profile", to: "/doctor/profile", icon: UserRound }
];

const DoctorLayout = () => {
  const navigate = useNavigate();
  const fullName = localStorage.getItem("fullName") || "";
  const trimmedName = fullName.trim();
  const displayName = trimmedName
    ? /^dr\.?\s+/i.test(trimmedName)
      ? trimmedName
      : `Dr. ${trimmedName}`
    : "Doctor";

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
            {navItems.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-[#01696f]/20 text-[#7be0e6] shadow-[0_10px_30px_-20px_rgba(1,105,111,0.9)]"
                      : "text-slate-300 hover:bg-slate-900/60"
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
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
                </div>
                <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">
                  Secure access via API Gateway
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
