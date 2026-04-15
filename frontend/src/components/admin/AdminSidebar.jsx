import { LayoutDashboard, LogOut, Settings, ShieldCheck, UserCog, UserPlus, Users, X } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { useAuth } from "../../hooks/useAuth.js";
import Logo from "../common/Logo.jsx";

const AdminSidebar = ({ mobileOpen = false, onMobileClose }) => {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuth();

  const links = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/admin/doctors/pending", label: "Pending Doctors", icon: ShieldCheck },
    { to: "/admin/users", label: "Users", icon: Users },
    ...(user?.role === "SUPER_ADMIN"
      ? [{ to: "/admin/admins", label: "Admins", icon: UserPlus }]
      : []),
    { to: "/admin/profile", label: "Profile", icon: Settings },
    { to: "/admin/security", label: "Security", icon: UserCog }
  ];

  const handleLogout = async () => {
    onMobileClose?.();
    await clearAuth();
    navigate("/login", { replace: true });
  };

  const NavItems = () => (
    <>
      <nav className="mt-10 space-y-2">
        {links.map(({ to, label, icon, end }) => {
          const IconComponent = icon;
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onMobileClose}
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
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-medium text-[#EAF2FF] transition hover:bg-[rgba(47,128,237,0.15)] hover:text-white"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/6">
            <LogOut size={18} />
          </div>
          <span>Sign out</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ── Desktop Sidebar (lg+) ── */}
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-white/6 bg-[#0B1F3A] px-5 py-6 text-[#EAF2FF] lg:flex lg:flex-col">
        <div className="px-1">
          <Logo showEyebrow={false} theme="dark" />
        </div>
        <NavItems />
      </aside>

      {/* ── Mobile Drawer Overlay (< lg) ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <Motion.div
              key="admin-sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={onMobileClose}
              className="fixed inset-0 z-40 bg-[#0B1F3A]/70 backdrop-blur-sm lg:hidden"
            />

            {/* Drawer panel */}
            <Motion.aside
              key="admin-sidebar-drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#0B1F3A] px-5 py-6 text-[#EAF2FF] shadow-2xl lg:hidden"
            >
              {/* Drawer header with close button */}
              <div className="flex items-center justify-between px-1">
                <Logo showEyebrow={false} theme="dark" />
                <button
                  type="button"
                  onClick={onMobileClose}
                  aria-label="Close navigation"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/6 text-[#EAF2FF] transition hover:bg-white/12"
                >
                  <X size={18} />
                </button>
              </div>
              <NavItems />
            </Motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminSidebar;
