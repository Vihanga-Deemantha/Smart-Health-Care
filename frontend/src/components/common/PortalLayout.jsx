import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, LogOut, ShieldCheck, HeartPulse, ChevronRight } from "lucide-react";
import { motion as Motion } from "framer-motion";
import StatusBadge from "./StatusBadge.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import PageContainer from "./PageContainer.jsx";
import healthcareTeam from "../../assets/healthcare_team.png";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (d = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: d },
  }),
};

const PortalLayout = ({ eyebrow, title, description, accent = "cyan", children }) => {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuth();

  const handleLogout = async () => {
    await clearAuth();
    navigate("/login", { replace: true });
  };

  const isDoctor = user?.role === "DOCTOR";
  const accentColor = accent === "blue" || isDoctor ? "#2F80ED" : "#56CCF2";
  const accentBg =
    accent === "blue" || isDoctor ? "rgba(47,128,237,0.12)" : "rgba(86,204,242,0.12)";

  return (
    <div
      className="min-h-screen"
      style={{
        background: "#071324",
        backgroundImage: `
          radial-gradient(at 0% 0%, rgba(47,128,237,0.15) 0px, transparent 50%),
          radial-gradient(at 100% 100%, rgba(86,204,242,0.08) 0px, transparent 50%)
        `,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Google Font */}
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* Grid overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      <PageContainer className="relative py-6 sm:py-8">
        {/* ── Header ── */}
        <Motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          }}
        >
          {/* Brand + user info */}
          <div className="flex items-center gap-4">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #2F80ED, #56CCF2)", boxShadow: "0 0 20px rgba(47,128,237,0.35)" }}
            >
              <HeartPulse size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-black text-white tracking-tight">Healio</span>
                <span className="text-[9px] font-bold uppercase tracking-[0.3em]" style={{ color: "#56CCF2" }}>Medical</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
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

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200"
              style={{ color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(86,204,242,0.4)"; e.currentTarget.style.color = "#56CCF2"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
            >
              Home <ArrowRight size={13} />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white transition-all duration-200 hover:scale-[1.02] hover:brightness-110"
              style={{ background: "linear-gradient(135deg, #2F80ED, #56CCF2)", boxShadow: "0 6px 20px rgba(47,128,237,0.35)" }}
            >
              <LogOut size={13} />
              Sign Out
            </button>
          </div>
        </Motion.header>

        {/* ── Body ── */}
        <section className="grid gap-8 py-8 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Main */}
          <Motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.1}>
            {/* Eyebrow + title */}
            <div className="mb-6">
              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest mb-3"
                style={{ background: accentBg, color: accentColor, border: `1px solid ${accentColor}40` }}
              >
                <span className="h-1.5 w-1.5 rounded-full animate-pulse inline-block" style={{ background: accentColor }} />
                {eyebrow}
              </span>
              <h1 className="text-3xl font-black text-white tracking-tight sm:text-4xl">{title}</h1>
              <p className="mt-2 text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>{description}</p>
            </div>

            {/* Children */}
            <div
              className="rounded-2xl p-6 sm:p-8"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              }}
            >
              {children}
            </div>
          </Motion.div>

          {/* Sidebar — reordered to appear below content on mobile */}
          <Motion.aside
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.2}
            className="order-last space-y-5 lg:order-none"
          >
            {/* Account Snapshot */}
            <div
              className="rounded-2xl p-6"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="h-10 w-10 flex items-center justify-center rounded-xl"
                  style={{ background: "rgba(39,174,96,0.15)", border: "1px solid rgba(39,174,96,0.25)" }}
                >
                  <ShieldCheck size={18} style={{ color: "#27AE60" }} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#27AE60" }}>Verified Session</p>
                  <p className="text-sm font-bold text-white">Account Snapshot</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { label: "Full Name", value: user?.fullName || "—" },
                  { label: "Email", value: user?.email || "—" },
                  { label: "Role", value: user?.role || "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</span>
                    <span className="text-sm font-semibold text-white break-all">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform Image Card */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="relative">
                <img
                  src={healthcareTeam}
                  alt="Healio clinical team"
                  className="w-full h-36 object-cover"
                  style={{ opacity: 0.7 }}
                />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(7,19,36,0.9) 10%, transparent 70%)" }} />
                <div
                  className="absolute bottom-3 left-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                  style={{ background: "rgba(47,128,237,0.2)", border: "1px solid rgba(86,204,242,0.25)", backdropFilter: "blur(8px)" }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#27AE60] animate-pulse inline-block" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">Session Active</span>
                </div>
              </div>
              <div className="p-5" style={{ background: "rgba(255,255,255,0.03)" }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: accentColor }}>
                  Healio Platform
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Your session is active and protected through the Healio gateway and service-level access controls.
                </p>
              </div>
            </div>
          </Motion.aside>
        </section>
      </PageContainer>
    </div>
  );
};

export default PortalLayout;
