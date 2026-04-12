import { BadgeCheck, ClipboardList, Stethoscope, CalendarDays, Users, Bell, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PortalLayout from "../../components/common/PortalLayout.jsx";
import { useAuth } from "../../hooks/useAuth.js";

const cardPop = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: (d = 0) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: d },
  }),
};

const DoctorHomePage = () => {
  const { user } = useAuth();
  const firstName = user?.fullName?.split(" ")[0] || "Doctor";

  const highlights = [
    {
      icon: BadgeCheck,
      accent: "#2F80ED",
      title: "Verified Clinician",
      text: "Your account has passed verification and is ready for secure clinical access and patient management.",
    },
    {
      icon: Stethoscope,
      accent: "#56CCF2",
      title: "Clinical Workspace",
      text: "Your secure starting point for schedules, appointments, and structured care workflows.",
    },
    {
      icon: ClipboardList,
      accent: "#27AE60",
      title: "Protected Operations",
      text: "Doctor access is guarded through approval checks, backend controls, and real-time session monitoring.",
    },
  ];

  const quickActions = [
    { icon: CalendarDays, label: "View Schedule", desc: "Today's appointments", to: "/doctor/appointments", accent: "#2F80ED" },
    { icon: Users, label: "Patient Records", desc: "Access clinical files", to: "/doctor/patients", accent: "#56CCF2" },
    { icon: Bell, label: "Notifications", desc: "Alerts & updates", to: "/doctor/notifications", accent: "#F2994A" },
  ];

  return (
    <PortalLayout
      eyebrow="Doctor Portal"
      title={`Welcome back, Dr. ${firstName}`}
      description="Your clinical workspace is ready. Manage appointments, access patient records, and stay connected with your care team."
      accent="blue"
    >
      {/* Quick Actions */}
      <div className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>Quick Actions</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickActions.map(({ icon: Icon, label, desc, to, accent }, i) => (
            <motion.div key={label} variants={cardPop} initial="hidden" animate="visible" custom={i * 0.1}>
              <Link
                to={to}
                className="group flex items-center gap-3 rounded-xl p-4 transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  background: `${accent}12`,
                  border: `1px solid ${accent}25`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 10px 30px ${accent}25`; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
              >
                <div
                  className="h-10 w-10 flex items-center justify-center rounded-xl flex-shrink-0"
                  style={{ background: `${accent}20`, border: `1px solid ${accent}30` }}
                >
                  <Icon size={18} style={{ color: accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{label}</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{desc}</p>
                </div>
                <ArrowRight size={14} className="flex-shrink-0 transition-transform group-hover:translate-x-1" style={{ color: accent }} />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Highlights */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>Platform Capabilities</p>
        <div className="grid gap-4 lg:grid-cols-3">
          {highlights.map(({ icon: Icon, accent, title, text }, i) => (
            <motion.div
              key={title}
              variants={cardPop}
              initial="hidden"
              animate="visible"
              custom={0.3 + i * 0.1}
              className="rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 10px 30px ${accent}18`; e.currentTarget.style.borderColor = `${accent}30`; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
            >
              <div
                className="h-11 w-11 flex items-center justify-center rounded-xl mb-4"
                style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
              >
                <Icon size={20} style={{ color: accent }} />
              </div>
              <h3 className="text-sm font-bold text-white mb-2">{title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </PortalLayout>
  );
};

export default DoctorHomePage;
