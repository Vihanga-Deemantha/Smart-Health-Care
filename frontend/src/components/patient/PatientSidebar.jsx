import { Link, useLocation } from "react-router-dom";
import { Calendar, Search, Clock, CheckCircle, FileText, LogOut, X } from "lucide-react";
import { AnimatePresence, motion as Motion } from "framer-motion";

const menuItems = [
  { icon: Calendar,     label: "Dashboard",         path: "/patient" },
  { icon: Search,       label: "Find Doctor",        path: "/patient/find-doctor" },
  { icon: Clock,        label: "My Appointments",    path: "/patient/appointments" },
  { icon: FileText,     label: "Prescriptions",      path: "/prescriptions" },
  { icon: CheckCircle,  label: "Completed Bookings", path: "/patient/bookings" },
];

const PatientSidebar = ({ onLogout, mobileOpen = false, onMobileClose }) => {
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/patient") return location.pathname === "/patient";
    return location.pathname.startsWith(path);
  };

  const NavContent = ({ onItemClick }) => (
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
            onClick={onItemClick}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
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

      <div className="mt-4 border-t border-white/10 pt-4">
        <button
          onClick={() => { onItemClick?.(); onLogout?.(); }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </nav>
  );

  return (
    <>
      {/* ── Desktop sidebar (lg+): always-visible aside ── */}
      <aside className="hidden h-full flex-col rounded-[28px] border border-white/10 bg-slate-900/75 p-6 backdrop-blur-xl lg:flex">
        <NavContent />
      </aside>

      {/* ── Mobile drawer overlay (< lg) ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <Motion.div
              key="patient-sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={onMobileClose}
              className="fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-sm lg:hidden"
            />
            {/* Drawer */}
            <Motion.div
              key="patient-sidebar-drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-slate-900 px-5 py-6 shadow-2xl lg:hidden"
            >
              <div className="mb-5 flex items-center justify-between">
                <p className="text-sm font-bold text-white">Patient Menu</p>
                <button
                  type="button"
                  aria-label="Close navigation"
                  onClick={onMobileClose}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/6 text-slate-300 transition hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
              <NavContent onItemClick={onMobileClose} />
            </Motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default PatientSidebar;
