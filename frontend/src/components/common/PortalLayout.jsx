import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, LogOut, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import Logo from "./Logo.jsx";
import PageContainer from "./PageContainer.jsx";
import SectionHeading from "./SectionHeading.jsx";
import StatusBadge from "./StatusBadge.jsx";
import { useAuth } from "../../hooks/useAuth.js";

const PortalLayout = ({ eyebrow, title, description, accent = "cyan", children }) => {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuth();

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
        <header className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-slate-900/75 p-5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
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
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/5"
            >
              Back to landing
              <ArrowRight size={16} />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </header>

        <section className="grid gap-8 py-10 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <SectionHeading eyebrow={eyebrow} title={title} description={description} />

            <div className="mt-8 rounded-[30px] border border-white/10 bg-slate-900/80 p-6 shadow-[0_30px_100px_-45px_rgba(14,165,233,0.45)] sm:p-8">
              {children}
            </div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="space-y-5"
          >
            <div className="rounded-[28px] border border-white/10 bg-slate-900/75 p-6 backdrop-blur-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                <ShieldCheck size={22} />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-white">Account snapshot</h2>
              <div className="mt-5 space-y-4 text-sm text-slate-300">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Full name</p>
                  <p className="mt-1 text-base font-medium text-white">{user?.fullName || "-"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Email</p>
                  <p className="mt-1 break-all text-base font-medium text-white">{user?.email || "-"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Access role</p>
                  <p className="mt-1 text-base font-medium text-white">{user?.role || "-"}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-cyan-400/15 bg-cyan-400/10 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
                Protected by gateway
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-100">
                Your session is running through the API gateway with JWT access control, refresh-token
                rotation, and service-level protection behind the scenes.
              </p>
            </div>
          </motion.aside>
        </section>
      </PageContainer>
    </div>
  );
};

export default PortalLayout;
