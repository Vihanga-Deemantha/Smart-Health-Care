import { LayoutDashboard, ShieldCheck, UserCog, Users } from "lucide-react";
import { NavLink } from "react-router-dom";
import Logo from "../common/Logo.jsx";

const links = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/doctors/pending", label: "Pending Doctors", icon: ShieldCheck },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/security", label: "Security", icon: UserCog }
];

const AdminSidebar = () => {
  return (
    <aside className="hidden w-80 border-r border-white/10 bg-slate-950/90 p-6 lg:block">
      <Logo />
      <div className="mt-12 space-y-2">
        {links.map(({ to, label, icon, end }) => {
          const IconComponent = icon;

          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-linear-to-r from-cyan-500/20 to-emerald-500/15 text-white ring-1 ring-cyan-400/20"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <IconComponent size={18} />
              {label}
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
};

export default AdminSidebar;
