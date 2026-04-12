import { Link, useLocation } from "react-router-dom";
import { Calendar, Search, Clock, CheckCircle, Wrench, LogOut } from "lucide-react";

const PatientSidebar = ({ onLogout }) => {
  const location = useLocation();

  const menuItems = [
    {
      icon: Calendar,
      label: "Dashboard",
      path: "/patient"
    },
    {
      icon: Search,
      label: "Find Doctor",
      path: "/patient/find-doctor"
    },
    {
      icon: Clock,
      label: "My Appointments",
      path: "/patient/appointments"
    },
    {
      icon: CheckCircle,
      label: "Completed Bookings",
      path: "/patient/bookings"
    },
    {
      icon: Wrench,
      label: "Service Tools",
      path: "/patient/tools"
    }
  ];

  const isActive = (path) => {
    if (path === "/patient") {
      return location.pathname === "/patient";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="flex h-full flex-col rounded-[28px] border border-white/10 bg-slate-900/75 p-6 backdrop-blur-xl">
      <nav className="space-y-2">
        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
          Patient Menu
        </p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-cyan-400/10 text-cyan-300"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/10 pt-4">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default PatientSidebar;
