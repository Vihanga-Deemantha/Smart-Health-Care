import { LayoutDashboard, LogOut, ShieldCheck, UserCog, Users } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import Logo from "../common/Logo.jsx";

const links = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/doctors/pending", label: "Pending Doctors", icon: ShieldCheck },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/security", label: "Security", icon: UserCog }
];

const AdminSidebar = () => {
  const navigate = useNavigate();
  const { clearAuth } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-white/6 bg-[#0B1F3A] px-5 py-6 text-[#EAF2FF] lg:flex lg:flex-col">
      <div className="px-1">
        <Logo showEyebrow={false} theme="dark" />
      </div>

      <nav className="mt-10 space-y-2">
        {links.map(({ to, label, icon, end }) => {
          const IconComponent = icon;

          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-[#2F80ED] text-white shadow-[0_16px_40px_-24px_rgba(47,128,237,0.9)]"
                    : "text-[#EAF2FF] hover:bg-[rgba(47,128,237,0.15)] hover:text-white"
                }`
              }
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/6 transition group-hover:border-white/15 group-hover:bg-white/10">
                <IconComponent size={18} />
              </div>
              <p>{label}</p>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto pt-6">
        <button
          type="button"
          onClick={async () => {
            await clearAuth();
            navigate("/login");
          }}
          className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-medium text-[#EAF2FF] transition hover:bg-[rgba(47,128,237,0.15)] hover:text-white"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/6">
            <LogOut size={18} />
          </div>
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
