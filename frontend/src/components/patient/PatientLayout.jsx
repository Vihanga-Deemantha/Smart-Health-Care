import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, LogOut, Menu } from "lucide-react";
import { motion } from "framer-motion";
import Logo from "../common/Logo.jsx";
import PageContainer from "../common/PageContainer.jsx";
import SectionHeading from "../common/SectionHeading.jsx";
import StatusBadge from "../common/StatusBadge.jsx";
import PatientSidebar from "./PatientSidebar.jsx";
import { useAuth } from "../../hooks/useAuth.js";

const PatientLayout = ({ eyebrow, title, description, accent = "cyan", children }) => {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const accentStyles = {
    cyan: "from-cyan-400/20 via-blue-500/10 to-transparent",
    blue: "from-blue-400/20 via-cyan-500/10 to-transparent"
  };

  const handleLogout = async () => {
    await clearAuth();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-linear-to-b ${accentStyles[accent] || accentStyles.cyan}`}
      />
      <PageContainer className="relative py-6 sm:py-8">
        {/* ── Header ── */}
        <header className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-slate-900/75 p-5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile hamburger */}
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setMobileSidebarOpen(true)}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/6 text-cyan-300 transition hover:bg-white/12 lg:hidden"
            >
              <Menu size={20} />
            </button>

            <Logo />
            <div className="hidden h-10 w-px bg-white/10 sm:block" />
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300/80">
                Signed in securely
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge value={user?.role} />
                <StatusBadge value={user?.accountStatus} />
                {user?.doctorVerificationStatus &&
                user?.role === "DOCTOR" &&
                user.doctorVerificationStatus !== "NOT_REQUIRED" ? (
                  <StatusBadge value={user.doctorVerificationStatus} />
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </header>

        {/* ── Body ── */}
        <section className="grid gap-8 py-10 lg:grid-cols-[0.4fr_1fr]">
          {/* Sidebar: desktop shows in grid, mobile shows as drawer */}
          <motion.aside
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.04 }}
            className="lg:block"
          >
            <PatientSidebar
              onLogout={handleLogout}
              mobileOpen={mobileSidebarOpen}
              onMobileClose={() => setMobileSidebarOpen(false)}
            />
          </motion.aside>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <SectionHeading eyebrow={eyebrow} title={title} description={description} />

            <div className="rounded-[30px] border border-white/10 bg-slate-900/80 p-6 shadow-[0_30px_100px_-45px_rgba(14,165,233,0.45)] sm:p-8">
              {children}
            </div>
          </motion.div>
        </section>
      </PageContainer>
    </div>
  );
};

export default PatientLayout;
