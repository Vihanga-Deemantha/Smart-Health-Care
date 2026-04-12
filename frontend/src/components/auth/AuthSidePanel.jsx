import { motion as Motion } from "framer-motion";
import { ShieldCheck, Stethoscope, UserRoundCheck, HeartPulse } from "lucide-react";

const highlights = [
  {
    icon: ShieldCheck,
    accent: "#56CCF2",
    title: "Security-First Access",
    text: "Protected sessions, OTP verification, and role-based gateways keep your data safe.",
  },
  {
    icon: Stethoscope,
    accent: "#2F80ED",
    title: "Built for Clinical Teams",
    text: "Patient onboarding and doctor workflows designed for real healthcare operations.",
  },
  {
    icon: UserRoundCheck,
    accent: "#27AE60",
    title: "One Platform, Every Role",
    text: "Patients, doctors, and administrators — all in a single, secure workspace.",
  },
];

const stats = [
  { value: "25K+", label: "Patients" },
  { value: "99.9%", label: "Uptime" },
  { value: "HIPAA", label: "Compliant" },
];

const AuthSidePanel = () => {
  return (
    <div
      className="relative overflow-hidden rounded-3xl p-8 lg:p-10"
      style={{
        background: "linear-gradient(145deg, #0B1F3A 0%, #071324 60%, #0d1e35 100%)",
        border: "1px solid rgba(47,128,237,0.2)",
        boxShadow: "0 50px 120px rgba(0,0,0,0.5), 0 0 0 1px rgba(86,204,242,0.06)",
      }}
    >
      {/* Animated glow blobs */}
      <Motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.18, 0.1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-24 -left-24 w-80 h-80 rounded-full blur-3xl pointer-events-none"
        style={{ background: "#2F80ED" }}
      />
      <Motion.div
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.05, 0.12, 0.05] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="absolute -bottom-20 right-4 w-64 h-64 rounded-full blur-3xl pointer-events-none"
        style={{ background: "#56CCF2" }}
      />

      <div className="relative z-10">
        {/* Logo */}
        <Motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-3"
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{
              background: "linear-gradient(135deg, #2F80ED, #56CCF2)",
              boxShadow: "0 0 28px rgba(47,128,237,0.45), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
          >
            <HeartPulse size={24} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-xl font-black text-white tracking-tight block leading-none">Healio</span>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.35em] block mt-0.5" style={{ color: "#56CCF2" }}>Medical Platform</span>
          </div>
        </Motion.div>

        {/* Badge */}
        <Motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="mt-8"
        >
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest"
            style={{ background: "rgba(86,204,242,0.12)", color: "#56CCF2", border: "1px solid rgba(86,204,242,0.25)" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#56CCF2] inline-block animate-pulse" />
            Trusted Clinical Access
          </span>
        </Motion.div>

        {/* Headline */}
        <Motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="mt-5 text-3xl font-black text-white leading-[1.15] tracking-tight sm:text-4xl"
        >
          Secure digital access<br />
          <span style={{ color: "#56CCF2" }}>for every care journey.</span>
        </Motion.h1>

        <Motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="mt-4 text-[15px] leading-relaxed"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          Healio gives patients, doctors, and administrators a secure, streamlined gateway to their healthcare workflows.
        </Motion.p>

        {/* Stats pills */}
        <Motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
          className="mt-6 flex gap-3"
        >
          {stats.map(({ value, label }) => (
            <div
              key={label}
              className="flex-1 rounded-2xl px-3 py-3 text-center"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <p className="text-lg font-black text-white leading-none">{value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
            </div>
          ))}
        </Motion.div>

        {/* Divider */}
        <div className="mt-8 mb-6 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />

        {/* Highlight Cards */}
        <div className="space-y-3">
          {highlights.map(({ icon, accent, title, text }, i) => {
            const IconComponent = icon;

            return (
            <Motion.div
              key={title}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.3 + i * 0.08 }}
              className="flex items-start gap-4 rounded-2xl p-4 transition-all duration-300"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                className="h-10 w-10 flex items-center justify-center rounded-xl flex-shrink-0 mt-0.5"
                style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}
              >
                <IconComponent size={17} style={{ color: accent }} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">{title}</h3>
                <p className="mt-1 text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{text}</p>
              </div>
            </Motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AuthSidePanel;
