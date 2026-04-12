import { CalendarDays, HeartPulse, ShieldCheck, FileText, CreditCard, Bell, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import PortalLayout from "../../components/common/PortalLayout.jsx";
import { useAuth } from "../../hooks/useAuth.js";

const cardPop = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: (d = 0) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: d },
  }),
};

const PatientHomePage = () => {
  const { user } = useAuth();
  const MotionDiv = Motion.div;
  const firstName = user?.fullName?.split(" ")[0] || "there";

  const highlights = [
    {
      icon: HeartPulse,
      accent: "#56CCF2",
      title: "Account Active",
      text: "Your patient account is verified and ready for secure access to all care services on Healio.",
    },
    {
      icon: ShieldCheck,
      accent: "#27AE60",
      title: "Secure Session",
      text: "Your session is protected through the Healio gateway with end-to-end encryption.",
    },
    {
      icon: CalendarDays,
      accent: "#2F80ED",
      title: "Ready for Care",
      text: "Book appointments, manage prescriptions, and track your health records — all in one place.",
    },
  ];

  const quickActions = [
    { icon: CalendarDays, label: "Book Appointment", desc: "Find & schedule a doctor", to: "/patient/book", accent: "#2F80ED" },
    { icon: FileText, label: "Health Records", desc: "View medical history", to: "/patient/records", accent: "#56CCF2" },
    { icon: CreditCard, label: "Billing", desc: "Payments & invoices", to: "/patient/billing", accent: "#F2994A" },
    { icon: Bell, label: "Notifications", desc: "Updates & reminders", to: "/patient/notifications", accent: "#27AE60" },
  ];

  return (
    <PortalLayout
      eyebrow="Patient Portal"
      title={`Hello, ${firstName} 👋`}
      description="Your health is in good hands. Access your appointments, medical records, and connect with your care team."
      accent="cyan"
    >
      {/* Quick Actions */}
      <div className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map(({ icon, label, desc, to, accent }, i) => {
            const IconComponent = icon;

            return (
              <MotionDiv key={label} variants={cardPop} initial="hidden" animate="visible" custom={i * 0.08}>
                <Link
                  to={to}
                  className="group flex flex-col items-center text-center gap-2 rounded-xl p-4 transition-all duration-300 hover:-translate-y-0.5"
                  style={{
                    background: `${accent}10`,
                    border: `1px solid ${accent}22`,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 10px 25px ${accent}22`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div
                    className="h-11 w-11 flex items-center justify-center rounded-xl"
                    style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
                  >
                    <IconComponent size={20} style={{ color: accent }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{label}</p>
                    <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{desc}</p>
                  </div>
                </Link>
              </MotionDiv>
            );
          })}
        </div>
      </div>

      {/* Highlights */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>Platform Benefits</p>
        <div className="grid gap-4 lg:grid-cols-3">
          {highlights.map(({ icon, accent, title, text }, i) => {
            const IconComponent = icon;

            return (
            <MotionDiv
              key={title}
              variants={cardPop}
              initial="hidden"
              animate="visible"
              custom={0.35 + i * 0.1}
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
                <IconComponent size={20} style={{ color: accent }} />
              </div>
              <h3 className="text-sm font-bold text-white mb-2">{title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{text}</p>
            </MotionDiv>
            );
          })}
        </div>
      </div>
    </PortalLayout>
  );
};

export default PatientHomePage;
