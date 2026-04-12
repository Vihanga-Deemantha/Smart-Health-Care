import {
  ArrowRight,
  Shield,
  Stethoscope,
  Activity,
  Users,
  Lock,
  Phone,
  Mail,
  MapPin,
  Clock,
  ChevronRight,
  Star,
  CheckCircle2,
  CalendarDays,
  HeartPulse,
  Video,
  Bell,
  FileText,
  CreditCard,
  UserCheck,
  Database,
  Wifi,
  Ambulance,
  Menu,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import healthcareHeroDoctor from "../../assets/healthcare_hero_doctor.png";
import healthcareTeam from "../../assets/healthcare_team.png";
import healthcareAppointment from "../../assets/healthcare_appointment.png";

/* ─── Theme ─────────────────────────────────────────────────── */
// Primary Colors: Navy (#0B1F3A), Royal Blue (#2F80ED), Bright Blue (#56CCF2)
// Secondary: Medical Green (#27AE60), Warning Orange (#F2994A)
// Neutrals: Pure White (#FFFFFF), Light Background (#F5F9FF), Soft Gray (#E0E7EF)
// Shadow: 0 10px 30px rgba(47,128,237,0.1)
// Gradient: linear-gradient(135deg, #2F80ED, #56CCF2)

/* ─── Animation Variants ────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 36 },
  visible: (d = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: d },
  }),
};

const fadeLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: (d = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: d },
  }),
};

const fadeRight = {
  hidden: { opacity: 0, x: 40 },
  visible: (d = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: d },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardPop = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  visible: (d = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: d },
  }),
};

/* ─── Data ─────────────────────────────────────────────────── */
const NAV_LINKS = ["Platform", "Services", "How It Works", "Security", "Contact"];

const STATS = [
  { value: "25K+", label: "Patients Onboarded" },
  { value: "99.9%", label: "Platform Uptime" },
  { value: "256-bit", label: "Data Encryption" },
  { value: "24/7", label: "Emergency Support" },
];

// 4 core platform pillars
const PILLARS = [
  {
    icon: UserCheck,
    accent: "#2F80ED",        // royal blue
    accentBg: "rgba(47,128,237,0.1)",
    tag: "Security & Access",
    title: "Secure Multi-Role Authentication",
    desc: "JWT session management, OTP verification, and gateway-based role routing — ensuring the right person reaches the right portal every time.",
    points: [
      "Role-based access: Patient · Doctor · Admin",
      "OTP two-factor verification on every login",
      "HIPAA-compliant session & audit logging",
    ],
  },
  {
    icon: Database,
    accent: "#56CCF2",        // bright blue
    accentBg: "rgba(86,204,242,0.1)",
    tag: "Patient Records",
    title: "Intelligent Patient Data Management",
    desc: "Centralised health records, structured file handling, and medical history management — all accessible securely from any device.",
    points: [
      "Encrypted storage of medical documents & scans",
      "Structured health records with quick retrieval",
      "Consent-based data sharing between care teams",
    ],
  },
  {
    icon: CalendarDays,
    accent: "#F2994A",        // warning orange (pivot to blue tones later if needed, but keeping for distinction)
    accentBg: "rgba(242,153,74,0.1)",
    tag: "Booking & Payments",
    title: "Smart Scheduling & Secure Payments",
    desc: "Intelligent booking logic respects doctor availability and scheduling constraints — paired with PCI-compliant online payment processing.",
    points: [
      "Real-time availability with conflict prevention",
      "Instant confirmation via SMS & email",
      "Secure payment gateway & billing records",
    ],
  },
  {
    icon: Video,
    accent: "#2D9CDB",        // sky blue variant
    accentBg: "rgba(45,156,219,0.1)",
    tag: "Doctor Workflow",
    title: "Clinical Care & Doctor Tools",
    desc: "Direct clinical communication, live patient notifications, and structured workflows empower doctors to deliver exceptional remote and in-person care.",
    points: [
      "Secure clinical consultations with in-call chat",
      "Live push notifications for appointments & results",
      "Digital prescriptions & referral management",
    ],
  },
];

const HOW_IT_WORKS = [
  { step: "01", icon: UserCheck, label: "Create Your Account", desc: "Register as a patient, verify your identity via OTP, and access your secure health portal in minutes." },
  { step: "02", icon: CalendarDays, label: "Book an Appointment", desc: "Browse verified specialists, check live availability, and book — with instant confirmation and payment." },
  { step: "03", icon: Video, label: "Consult Your Doctor", desc: "Join a secure HD video session or visit in person. Receive digital prescriptions and follow-up care plans." },
  { step: "04", icon: FileText, label: "Manage Your Health", desc: "Access your complete health timeline, test results, and billing records — all in one secure place." },
];

const TESTIMONIALS = [
  {
    name: "Kavinda Perera",
    role: "Patient",
    text: "Booking was instant and the video consultation was crystal clear. Getting my prescription digitally saved me hours.",
    stars: 5,
  },
  {
    name: "Dr. Nimali Silva",
    role: "Consultant",
    text: "The Healio portal gives me everything I need — patient history, scheduling, and real-time notifications in one clean dashboard.",
    stars: 5,
  },
  {
    name: "Thilini Jayawardena",
    role: "Patient",
    text: "My complete medical records are organised and secure. I finally feel in control of my own health data.",
    stars: 5,
  },
];

/* ─── Component ─────────────────────────────────────────────── */
const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#F5F9FF", color: "#0B1F3A" }}
    >
      {/* ── Google Font ── */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          position: relative;
          overflow: hidden;
        }
        .animate-shimmer::after {
          content: '';
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          animation: shimmer 2.5s infinite;
        }
      `}</style>

      {/* ══════════════════════════ NAVBAR ══════════════════════ */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(11,31,58,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.12)" : "none",
          boxShadow: scrolled ? "0 10px 40px rgba(0,0,0,0.3)" : "none",
        }}
      >
        <PageContainer>
          <nav className="flex items-center justify-between h-20">
            {/* Logo */}
            <Motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-3"
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl shadow-[0_0_20px_rgba(47,128,237,0.4)]"
                style={{ background: "linear-gradient(135deg, #2F80ED, #56CCF2)" }}
              >
                <HeartPulse size={22} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-[18px] font-black text-white tracking-tight leading-none">Healio</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#56CCF2] opacity-80 mt-1">Medical</span>
              </div>
            </Motion.div>

            {/* Desktop nav */}
            <Motion.ul
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="hidden lg:flex items-center gap-7"
            >
              {NAV_LINKS.map((item) => (
                <li key={item}>
                  <a
                    href={`#${item.toLowerCase().replace(/\s/g, "-")}`}
                    className="text-sm font-medium transition-colors duration-200"
                    style={{ color: "rgba(255,255,255,0.75)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#56CCF2")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.75)")}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </Motion.ul>

            {/* Desktop actions */}
            <Motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden lg:flex items-center gap-3"
            >
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200"
                style={{ color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.18)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(86,204,242,0.6)";
                  e.currentTarget.style.color = "#56CCF2";
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.85)";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <Lock size={13} />
                Sign In
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:scale-105"
                style={{ background: "linear-gradient(135deg, #2F80ED, #1C6ED5)", boxShadow: "0 8px 24px rgba(47,128,237,0.4)" }}
              >
                <CalendarDays size={13} />
                Book Appointment
              </Link>
            </Motion.div>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden text-white p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </nav>
        </PageContainer>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <Motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden overflow-hidden"
              style={{ background: "rgba(31,40,59,0.98)", borderTop: "1px solid rgba(255,255,255,0.07)" }}
            >
              <PageContainer className="py-5 flex flex-col gap-4">
                {NAV_LINKS.map((item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase().replace(/\s/g, "-")}`}
                    className="text-sm font-medium py-1"
                    style={{ color: "rgba(255,255,255,0.75)" }}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item}
                  </a>
                ))}
                <div className="flex gap-3 pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                  <Link to="/login" className="flex-1 text-center rounded-lg py-2.5 text-sm font-semibold" style={{ border: "1px solid rgba(255,255,255,0.22)", color: "white" }}>Sign In</Link>
                  <Link to="/register" className="flex-1 text-center rounded-lg py-2.5 text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #2F80ED, #1C6ED5)" }}>Book Now</Link>
                </div>
              </PageContainer>
            </Motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ══════════════════════════ HERO ════════════════════════ */}
      <section
        id="platform"
        className="relative min-h-screen flex items-end overflow-hidden"
        style={{
          background: "#071324",
          backgroundImage: `
            radial-gradient(at 0% 0%, rgba(47, 128, 237, 0.15) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(86, 204, 242, 0.12) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(47, 128, 237, 0.1) 0px, transparent 50%),
            radial-gradient(at 0% 100%, rgba(11, 31, 58, 1) 0px, transparent 50%)
          `,
        }}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        {/* Animated Glow Blobs */}
        <Motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.08, 0.12, 0.08],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/3 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none"
          style={{ background: "#2F80ED" }}
        />
        <Motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-10 right-10 w-[450px] h-[450px] rounded-full blur-[100px] pointer-events-none"
          style={{ background: "#56CCF2" }}
        />

        {/* Doctor image — right-aligned, bleeds to bottom */}
        <div className="absolute bottom-0 right-0 w-[46%] h-full pointer-events-none hidden md:block">
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, #0B1F3A 0%, transparent 30%)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #0B1F3A 0%, transparent 25%)" }} />
          <img
            src={healthcareHeroDoctor}
            alt="Healthcare professional"
            className="w-full h-full object-cover object-top"
            style={{ opacity: 0.82 }}
          />
        </div>

        {/* Content */}
        <PageContainer className="relative z-10 pb-28 pt-40">
          <div className="max-w-[600px]">
            {/* Badge */}
            <Motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-7 shadow-[0_0_20px_rgba(47,128,237,0.15)]"
              style={{ background: "rgba(47,128,237,0.12)", border: "1px solid rgba(86,204,242,0.25)" }}
            >
              <span className="flex h-2 w-2 rounded-full animate-pulse" style={{ background: "#56CCF2" }} />
              <span className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: "#56CCF2" }}>
                Unified Clinical Platform
              </span>
            </Motion.div>

            {/* Headline */}
            <Motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.1}
              className="text-5xl font-black leading-[1.05] sm:text-6xl xl:text-7xl text-white tracking-tight"
            >
              Healio.{" "}
              <br />
              <span style={{ color: "#56CCF2" }}>Modern Care.</span>
              <br />
              Secure Data.
            </Motion.h1>

            <Motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.2}
              className="mt-7 text-lg leading-relaxed max-w-[500px]"
              style={{ color: "rgba(255,255,255,0.65)" }}
            >
              Experience a unified digital health platform — secure multi-role access, intelligent scheduling, and encrypted patient data management, built for modern clinics.
            </Motion.p>

            {/* CTAs */}
            <Motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.3}
              className="mt-10 flex flex-wrap gap-4"
            >
              <Link
                to="/register"
                className="group animate-shimmer inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-bold text-white transition-all duration-300 hover:scale-105 hover:brightness-110"
                style={{ background: "linear-gradient(135deg, #2F80ED, #56CCF2)", boxShadow: "0 10px 40px rgba(47,128,237,0.5)" }}
              >
                Get Started Free
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.92)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.borderColor = "rgba(86,204,242,0.4)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; }}
              >
                <Lock size={16} />
                Sign In to Portal
              </Link>
            </Motion.div>

            {/* Emergency strip */}
            <Motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.4}
              className="mt-10 inline-flex items-center gap-3 rounded-xl px-5 py-3"
              style={{ background: "rgba(235,87,87,0.12)", border: "1px solid rgba(235,87,87,0.25)" }}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: "#EB5757" }}>
                <Ambulance size={17} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#fca5a5" }}>Emergency Response</p>
                <p className="text-base font-extrabold" style={{ color: "#fca5a5" }}>+94 117 000 000</p>
              </div>
            </Motion.div>
          </div>

          {/* Floating stat cards */}
          <Motion.div
            variants={fadeRight}
            initial="hidden"
            animate="visible"
            custom={0.5}
            className="absolute bottom-28 right-[46%] z-20 hidden xl:block"
          >
            <Motion.div
              animate={{ y: [0, -9, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              className="rounded-2xl p-4 shadow-2xl flex items-center gap-3"
              style={{ background: "#FFFFFF", boxShadow: "0 10px 30px rgba(47,128,237,0.12)", border: "1px solid rgba(47,128,237,0.08)" }}
            >
              <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(47,128,237,0.12)" }}>
                <Activity size={22} style={{ color: "#2F80ED" }} />
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: "#64748b" }}>Recovery Rate</p>
                <p className="text-2xl font-black" style={{ color: "#1f283b" }}>98.2%</p>
              </div>
            </Motion.div>
          </Motion.div>

          <Motion.div
            variants={fadeRight}
            initial="hidden"
            animate="visible"
            custom={0.6}
            className="absolute top-52 right-[44%] z-20 hidden xl:block"
          >
            <Motion.div
              animate={{ y: [0, 9, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
              className="rounded-2xl p-4 shadow-2xl flex items-center gap-3"
              style={{ background: "#FFFFFF", boxShadow: "0 10px 30px rgba(47,128,237,0.12)", border: "1px solid rgba(47,128,237,0.08)" }}
            >
              <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(86,204,242,0.15)" }}>
                <Users size={22} style={{ color: "#2F80ED" }} />
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: "#64748b" }}>Patients Served</p>
                <p className="text-2xl font-black" style={{ color: "#1f283b" }}>25K+</p>
              </div>
            </Motion.div>
          </Motion.div>
        </PageContainer>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none" style={{ height: 70 }}>
          <svg viewBox="0 0 1440 70" preserveAspectRatio="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,40 C480,80 960,0 1440,40 L1440,70 L0,70 Z" fill="#F5F9FF" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════ STATS BAR ═══════════════════ */}
      <section style={{ background: "#F5F9FF" }}>
        <PageContainer className="py-14">
          <Motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              { value: "25K+", label: "Patients Served" },
              { value: "99.9%", label: "System Uptime" },
              { value: "Secure", label: "Data Encryption" },
              { value: "24/7", label: "Care Support" },
            ].map((s, i) => (
              <Motion.div
                key={i}
                variants={cardPop}
                custom={i * 0.08}
                className="text-center rounded-2xl py-7 px-5 hover:-translate-y-1 transition-transform"
                style={{ background: "white", border: "1px solid rgba(47,128,237,0.1)", boxShadow: "0 10px 30px rgba(47,128,237,0.08)" }}
              >
                <p className="text-4xl font-black tracking-tight" style={{ color: "#2F80ED" }}>{s.value}</p>
                <p className="mt-1.5 text-xs font-bold uppercase tracking-widest opacity-60" style={{ color: "#64748b" }}>{s.label}</p>
              </Motion.div>
            ))}
          </Motion.div>
        </PageContainer>
      </section>

      {/* ══════════════════════════ PLATFORM PILLARS ════════════ */}
      <section id="services" className="py-28" style={{ background: "#0B1F3A" }}>
        <PageContainer>
          <Motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-16"
          >
            <span
              className="inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-4"
              style={{ background: "rgba(86,204,242,0.15)", color: "#56CCF2", border: "1px solid rgba(86,204,242,0.3)" }}
            >
              The Healio Advantage
            </span>
            <h2 className="text-4xl font-extrabold sm:text-5xl text-white tracking-tight">
              Four Pillars of Modern Care
            </h2>
            <p className="mt-5 text-lg max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.55)" }}>
              Every feature built around security, patient care, efficient workflows, and real-time clinical connectivity.
            </p>
          </Motion.div>

          {/* ── Horizontal pillar cards ── */}
          <div className="space-y-6">
            {PILLARS.map((p, i) => (
              <Motion.div
                key={p.tag}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                custom={i * 0.1}
                className="group relative flex gap-0 rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-[0_20px_50px_rgba(47,128,237,0.25)] hover:-translate-y-1.5"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(47,128,237,0.12)",
                  boxShadow: "0 10px 40px rgba(47,128,237,0.06)",
                }}
              >
                {/* Border Glow pseudo-effect */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#2F80ED] opacity-0 group-hover:opacity-10 transition-all duration-500 rounded-2xl" />
                {/* Left accent bar with number */}
                <div
                  className="flex-shrink-0 w-[80px] flex flex-col items-center justify-center gap-3 py-8"
                  style={{ background: `linear-gradient(180deg, ${p.accent}12 0%, ${p.accent}05 100%)`, borderRight: `3px solid ${p.accent}` }}
                >
                  <span
                    className="text-2xl font-black"
                    style={{ color: p.accent, opacity: 0.4 }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center shadow-sm"
                    style={{ background: "#FFFFFF", border: `1px solid ${p.accent}30` }}
                  >
                    <p.icon size={22} style={{ color: p.accent }} />
                  </div>
                </div>

                {/* Content area */}
                <div className="flex flex-1 flex-col md:flex-row">
                  {/* Left: tag + title + desc */}
                  <div className="flex-1 p-7 pr-5">
                    <span
                      className="inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest mb-3"
                      style={{ background: `${p.accent}12`, color: p.accent }}
                    >
                      {p.tag}
                    </span>
                    <h3 className="text-xl font-extrabold leading-snug" style={{ color: "#0B1F3A" }}>{p.title}</h3>
                    <p className="mt-2.5 text-sm leading-relaxed" style={{ color: "#475569" }}>{p.desc}</p>
                  </div>

                  {/* Right: bullet points */}
                  <div
                    className="flex-shrink-0 md:w-72 p-7 pl-5 flex flex-col justify-center gap-3 bg-[#f8fbff]"
                    style={{ borderLeft: "1px solid rgba(47,128,237,0.08)" }}
                  >
                    {p.points.map((pt) => (
                      <div key={pt} className="flex items-start gap-2.5">
                        <div
                          className="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: "#E8F5E9" }}
                        >
                          <CheckCircle2 size={13} style={{ color: "#27AE60" }} />
                        </div>
                        <span className="text-sm font-medium" style={{ color: "#475569" }}>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hover glow bar at bottom */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(90deg, ${p.accent}, #56CCF2)` }}
                />
              </Motion.div>
            ))}
          </div>
        </PageContainer>
      </section>

      {/* ══════════════════════════ ABOUT / TEAM ════════════════ */}
      <section id="about" className="py-28" style={{ background: "#F5F9FF" }}>
        <PageContainer>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left image */}
            <Motion.div
              variants={fadeLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl" style={{ boxShadow: "0 20px 60px rgba(47,128,237,0.15)" }}>
                <img src={healthcareTeam} alt="Our dedicated medical team" className="w-full h-[460px] object-cover" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(11,31,58,0.5) 0%, transparent 60%)" }} />
              </div>

              {/* Floating card */}
              <Motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-8 -right-5 rounded-2xl p-5 shadow-2xl max-w-xs"
                style={{ background: "white", border: "1px solid rgba(15,118,110,0.12)" }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex -space-x-2">
                    {["S","J","P"].map((l, n) => (
                      <div
                        key={n}
                        className="h-9 w-9 rounded-full border-2 border-white flex items-center justify-center text-xs font-black text-white"
                        style={{ background: `hsl(${160 + n * 25}, 55%, 40%)` }}
                      >{l}</div>
                    ))}
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, k) => <Star key={k} size={12} className="fill-amber-400 text-amber-400" />)}
                  </div>
                </div>
                <p className="text-sm font-semibold" style={{ color: "#1f283b" }}>
                  "Expert care combining innovation, compassion &amp; clinical precision."
                </p>
              </Motion.div>
            </Motion.div>

            {/* Right copy */}
            <Motion.div
              variants={fadeRight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
            >
              <span
                className="inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-4"
                style={{ background: "rgba(47,128,237,0.12)", color: "#2F80ED", border: "1px solid rgba(47,128,237,0.25)" }}
              >
                The Healio Mission
              </span>
              <h2 className="text-4xl font-extrabold leading-tight tracking-tight" style={{ color: "#0B1F3A" }}>
                Reliable Medical Services{" "}
                <span className="text-[#2F80ED]">Empowered by Technology</span>,
                Built for Better Outcomes
              </h2>
              <p className="mt-6 text-lg leading-relaxed" style={{ color: "#475569" }}>
                Healio unifies board-certified specialists, intelligent scheduling, and encrypted patient records — all in one clinical platform you can trust for your most critical healthcare workflows.
              </p>

              <Motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="mt-8 space-y-4"
              >
                {[
                  "Reliable medical care delivered with compassion and precision",
                  "Patient-focused treatment with full data ownership & consent",
                  "Expert clinical guidance from credentialed, vetted specialists",
                  "Preventive care programs for long-term health outcomes",
                ].map((item) => (
                  <Motion.div key={item} variants={fadeUp} custom={0} className="flex items-start gap-3">
                    <CheckCircle2 size={19} style={{ color: "#27AE60", marginTop: 2, flexShrink: 0 }} />
                    <span style={{ color: "#334155" }}>{item}</span>
                  </Motion.div>
                ))}
              </Motion.div>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold text-white hover:scale-105 hover:brightness-110 transition-all"
                  style={{ background: "linear-gradient(135deg, #2F80ED, #56CCF2)", boxShadow: "0 8px 22px rgba(47,128,237,0.35)" }}
                >
                  Get Started <ArrowRight size={16} />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 rounded-xl border-2 px-7 py-3.5 text-sm font-semibold transition-all hover:bg-white hover:shadow-lg"
                  style={{ borderColor: "rgba(47,128,237,0.2)", color: "#2F80ED" }}
                >
                  How It Works
                </a>
              </div>
            </Motion.div>
          </div>
        </PageContainer>
      </section>

      {/* ══════════════════════════ HOW IT WORKS ════════════════ */}
      <section
        id="how-it-works"
        className="py-28"
        style={{ background: "linear-gradient(160deg, #071324 0%, #0B1F3A 100%)" }}
      >
        <PageContainer>
          <Motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-20"
          >
            <span
              className="inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-4"
              style={{ background: "rgba(86,204,242,0.12)", color: "#56CCF2", border: "1px solid rgba(86,204,242,0.25)" }}
            >
              How It Works
            </span>
            <h2 className="text-4xl font-extrabold text-white sm:text-5xl">Your Journey to Better Health</h2>
            <p className="mt-5 text-lg max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.55)" }}>
              From registration to recovery — every step is designed to be simple, secure, and stress-free.
            </p>
          </Motion.div>

          <div className="relative">
            {/* Connector line */}
            <div className="absolute top-10 left-10 right-10 h-px hidden lg:block" style={{ background: "linear-gradient(to right, transparent, rgba(86,204,242,0.3), transparent)" }} />

            <Motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {HOW_IT_WORKS.map((step, i) => (
                <Motion.div
                  key={step.step}
                  variants={cardPop}
                  custom={i * 0.12}
                  className="relative rounded-3xl p-7 text-center"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  {/* Step number */}
                  <div
                    className="absolute -top-4 left-1/2 -translate-x-1/2 h-8 px-3 rounded-full flex items-center justify-center text-xs font-black shadow-lg"
                    style={{ background: "#2F80ED", color: "white" }}
                  >
                    {step.step}
                  </div>

                  <div
                    className="mx-auto mt-4 mb-5 h-16 w-16 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(47,128,237,0.15)", border: "1px solid rgba(86,204,242,0.25)" }}
                  >
                    <step.icon size={28} style={{ color: "#56CCF2" }} />
                  </div>

                  <h3 className="font-bold text-white mb-2">{step.label}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{step.desc}</p>
                </Motion.div>
              ))}
            </Motion.div>
          </div>
        </PageContainer>
      </section>

      {/* ══════════════════════════ BOOKING CTA SECTION ═════════ */}
      <section id="security" className="py-28" style={{ background: "#F5F9FF" }}>
        <PageContainer>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Text */}
            <Motion.div
              variants={fadeLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
            >
              <span
                className="inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-4"
                style={{ background: "rgba(47,128,237,0.12)", color: "#2F80ED", border: "1px solid rgba(47,128,237,0.2)" }}
              >
                Smart Scheduling
              </span>
              <h2 className="text-4xl font-extrabold leading-tight" style={{ color: "#0B1F3A" }}>
                Skip the Queue.{" "}
                <span style={{ color: "#2F80ED" }}>Book Online</span>{" "}
                in Seconds.
              </h2>
              <p className="mt-5 text-lg leading-relaxed" style={{ color: "#475569" }}>
                Our booking engine respects real-time doctor availability, prevents double-booking, and confirms your slot instantly — paired with secure payment processing.
              </p>

              <Motion.ul
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="mt-8 space-y-4"
              >
                {[
                  { icon: CalendarDays, color: "#2F80ED",  text: "Real-time availability calendar with conflict prevention" },
                  { icon: Bell,         color: "#F2994A",  text: "Instant SMS & email confirmation once booked" },
                  { icon: CreditCard,   color: "#56CCF2",  text: "PCI-compliant secure payment gateway" },
                  { icon: Video,        color: "#2D9CDB",  text: "One-click join for HD video consultations" },
                ].map((item) => (
                  <Motion.li key={item.text} variants={fadeUp} custom={0} className="flex items-center gap-3">
                    <div
                      className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${item.color}18` }}
                    >
                      <item.icon size={18} style={{ color: item.color }} />
                    </div>
                    <span style={{ color: "#475569" }}>{item.text}</span>
                  </Motion.li>
                ))}
              </Motion.ul>

              <Link
                to="/register"
                className="mt-10 inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-bold text-white hover:scale-105 hover:brightness-110 transition-all"
                style={{ background: "linear-gradient(135deg, #2F80ED, #56CCF2)", boxShadow: "0 10px 30px rgba(47,128,237,0.3)" }}
              >
                Book an Appointment <ArrowRight size={18} />
              </Link>
            </Motion.div>

            {/* Image */}
            <Motion.div
              variants={fadeRight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="relative"
            >
              <div className="absolute -inset-4 rounded-3xl blur-2xl opacity-[0.2]" style={{ background: "linear-gradient(135deg, #2F80ED, #56CCF2)" }} />
              <div className="relative rounded-3xl overflow-hidden shadow-2xl" style={{ boxShadow: "0 20px 60px rgba(47,128,237,0.15)" }}>
                <img src={healthcareAppointment} alt="Online appointment booking" className="w-full h-[420px] object-cover" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(11,31,58,0.3) 0%, transparent 50%)" }} />
              </div>

              {/* Badge */}
              <Motion.div
                animate={{ y: [0,-8,0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-5 -left-5 rounded-2xl p-4 shadow-2xl flex items-center gap-3"
                style={{ background: "white" }}
              >
                <div className="h-11 w-11 rounded-xl flex items-center justify-center shadow-sm" style={{ background: "rgba(47,128,237,0.12)" }}>
                  <Clock size={20} style={{ color: "#2F80ED" }} />
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: "#64748b" }}>Avg. Booking Time</p>
                  <p className="text-xl font-black" style={{ color: "#0B1F3A" }}>&lt; 3 mins</p>
                </div>
              </Motion.div>
            </Motion.div>
          </div>
        </PageContainer>
      </section>

      {/* ══════════════════════════ SECURITY HIGHLIGHT ══════════ */}
      <section
        className="py-24"
        style={{
          background: "#071324",
          backgroundImage: "radial-gradient(circle at 50% 50%, rgba(47,128,237,0.1) 0%, transparent 70%)"
        }}
      >
        <PageContainer>
          <Motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-16"
          >
            <span
              className="inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-4"
              style={{ background: "rgba(86,204,242,0.15)", color: "#56CCF2", border: "1px solid rgba(86,204,242,0.25)" }}
            >
              Security & Compliance
            </span>
            <h2 className="text-4xl font-extrabold text-white tracking-tight">
              Clinical Security You Can Trust
            </h2>
          </Motion.div>

          <Motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {[
              { icon: Shield,    accent: "#56CCF2", title: "HIPAA Compliant",        desc: "Full regulatory compliance with audit trails and role-based access controls." },
              { icon: Lock,      accent: "#2F80ED", title: "AES Encryption",         desc: "All patient data and medical records are encrypted at rest and in transit." },
              { icon: UserCheck, accent: "#F2994A", title: "OTP Verification",       desc: "Two-factor verification on every login — protecting patient and staff accounts." },
              { icon: Wifi,      accent: "#2D9CDB", title: "99.9% Uptime",           desc: "Enterprise-grade infrastructure with automated failover and real-time monitoring." },
            ].map((item, i) => (
              <Motion.div
                key={item.title}
                variants={cardPop}
                custom={i * 0.1}
                className="rounded-2xl p-6 text-center group hover:-translate-y-1 transition-all duration-300"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div
                  className="mx-auto mb-4 h-14 w-14 rounded-2xl flex items-center justify-center"
                  style={{ background: `${item.accent}18`, border: `1px solid ${item.accent}30` }}
                >
                  <item.icon size={24} style={{ color: item.accent }} />
                </div>
                <h3 className="font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{item.desc}</p>
              </Motion.div>
            ))}
          </Motion.div>
        </PageContainer>
      </section>

      {/* ══════════════════════════ TESTIMONIALS ════════════════ */}
      <section className="py-28" style={{ background: "#F5F9FF" }}>
        <PageContainer>
          <Motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-16"
          >
            <span
              className="inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-4"
              style={{ background: "rgba(47,128,237,0.12)", color: "#2F80ED", border: "1px solid rgba(47,128,237,0.2)" }}
            >
              Real Experiences
            </span>
            <h2 className="text-4xl font-extrabold" style={{ color: "#0B1F3A" }}>
              Trusted by Patients &amp; Clinicians
            </h2>
          </Motion.div>

          <Motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid md:grid-cols-3 gap-6"
          >
            {TESTIMONIALS.map((t, i) => (
              <Motion.div
                key={t.name}
                variants={cardPop}
                custom={i * 0.12}
                className="rounded-2xl p-7 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                style={{ background: "white", border: "1px solid rgba(47,128,237,0.08)", boxShadow: "0 10px 30px rgba(47,128,237,0.06)" }}
              >
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.stars)].map((_, s) => <Star key={s} size={14} className="fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-sm leading-relaxed italic mb-6" style={{ color: "#475569" }}>"{t.text}"</p>
                <div className="flex items-center gap-3 pt-4" style={{ borderTop: "1px solid rgba(15,45,94,0.07)" }}>
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0"
                    style={{ background: `hsl(${160 + i * 30}, 55%, 42%)` }}
                  >
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: "#1f283b" }}>{t.name}</p>
                    <p className="text-xs" style={{ color: "#94a3b8" }}>{t.role}</p>
                  </div>
                </div>
              </Motion.div>
            ))}
          </Motion.div>
        </PageContainer>
      </section>

      {/* ══════════════════════════ CONTACT STRIP ═══════════════ */}
      <section id="contact" style={{ background: "#f5f8ff", borderTop: "1px solid rgba(15,45,94,0.07)" }}>
        <PageContainer className="py-16">
          <Motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {[
              { icon: CalendarDays, accent: "#2F80ED", title: "Visiting Hours",    lines: ["Mon – Fri: 8 AM – 8 PM", "Sat – Sun: 9 AM – 5 PM"] },
              { icon: Phone,        accent: "#2D9CDB", title: "General Enquiries", lines: ["+94 117 000 001", "+94 117 000 002"] },
              { icon: Mail,         accent: "#56CCF2", title: "Email Support",     lines: ["info@smartcarehub.lk", "support@smartcarehub.lk"] },
              { icon: MapPin,       accent: "#F2994A", title: "Our Location",      lines: ["123 Medical Centre Rd", "Colombo 3, Sri Lanka"] },
            ].map((item, i) => (
              <Motion.div
                key={item.title}
                variants={cardPop}
                custom={i * 0.09}
                className="flex items-start gap-4 rounded-2xl p-5"
                style={{ background: "white", border: "1px solid rgba(15,45,94,0.09)", boxShadow: "0 2px 12px rgba(15,45,94,0.04)" }}
              >
                <div className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${item.accent}15` }}>
                  <item.icon size={20} style={{ color: item.accent }} />
                </div>
                <div>
                  <p className="font-bold text-sm mb-1" style={{ color: "#1f283b" }}>{item.title}</p>
                  {item.lines.map((l) => <p key={l} className="text-xs" style={{ color: "#64748b" }}>{l}</p>)}
                </div>
              </Motion.div>
            ))}
          </Motion.div>
        </PageContainer>
      </section>

      {/* ══════════════════════════ FINAL CTA ═══════════════════ */}
      <section
        className="py-28 relative overflow-hidden"
        style={{
          background: "#071324",
          backgroundImage: `
            radial-gradient(at 0% 100%, rgba(47,128,237,0.12) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(86, 204, 242, 0.08) 0px, transparent 50%)
          `
        }}
      >
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />

        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-10 blur-3xl" style={{ background: "#2F80ED" }} />

        <PageContainer className="relative z-10">
          <Motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center"
          >
            <div
              className="inline-flex h-20 w-20 items-center justify-center rounded-3xl mb-6 shadow-2xl"
              style={{ background: "rgba(47,128,237,0.15)", border: "1px solid rgba(86,204,242,0.2)" }}
            >
              <Stethoscope size={36} style={{ color: "#56CCF2" }} />
            </div>
            <h2 className="text-4xl font-extrabold text-white sm:text-5xl max-w-3xl mx-auto tracking-tight">
              Experience the Future of Clinical Care
            </h2>
            <p className="mt-6 text-xl max-w-2xl mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
              Join thousands of patients and clinicians on Healio a platform built for security, simplicity, and exceptional healthcare.
            </p>

            <div className="mt-12 flex flex-wrap justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl px-10 py-4 text-base font-bold text-white hover:scale-105 hover:brightness-110 transition-all shadow-xl"
                style={{ background: "linear-gradient(135deg, #2F80ED, #56CCF2)", boxShadow: "0 15px 45px rgba(47,128,237,0.5)" }}
              >
                <CalendarDays size={18} />
                Book Your First Appointment
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl px-10 py-4 text-base font-bold transition-all shadow-lg"
                style={{ 
                  background: "linear-gradient(#071324, #071324) padding-box, linear-gradient(135deg, #2F80ED, #56CCF2) border-box",
                  border: "2px solid transparent",
                  color: "#56CCF2",
                  backdropFilter: "blur(12px)" 
                }}
                onMouseEnter={(e) => { 
                  e.currentTarget.style.boxShadow = "0 0 30px rgba(47,128,237,0.3)"; 
                  e.currentTarget.style.transform = "translateY(-1px) scale(1.02)";
                  e.currentTarget.style.background = "linear-gradient(#0B1F3A, #0B1F3A) padding-box, linear-gradient(135deg, #2F80ED, #56CCF2) border-box";
                }}
                onMouseLeave={(e) => { 
                  e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.15)"; 
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.background = "linear-gradient(#071324, #071324) padding-box, linear-gradient(135deg, #2F80ED, #56CCF2) border-box";
                }}
              >
                <Lock size={18} style={{ color: "#56CCF2" }} />
                Patient Portal Login
              </Link>
            </div>
            <p className="mt-8 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
              No credit card required · HIPAA compliant · Secure 256-bit encryption
            </p>
          </Motion.div>
        </PageContainer>
      </section>

      {/* ══════════════════════════ FOOTER ══════════════════════ */}
      <footer style={{ background: "#071324", borderTop: "1px solid rgba(47,128,237,0.1)" }}>
        <PageContainer className="py-14">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg, #2F80ED, #56CCF2)" }}>
                <HeartPulse size={20} className="text-white" strokeWidth={2.5} />
                </div>
                <p className="font-black text-white text-xl tracking-tight">Healio</p>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                A secure, unified clinical platform built for patients, doctors, and medical administrators.
              </p>
            </div>

            {/* Platform */}
            <div>
              <p className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Platform</p>
              <ul className="space-y-2.5 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                {["Secure Authentication", "Patient Records", "Smart Booking", "Video Consultations", "Admin Dashboard"].map((s) => (
                  <li key={s}><a href="#" className="hover:text-blue-400 transition-colors">{s}</a></li>
                ))}
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <p className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Quick Links</p>
              <ul className="space-y-2.5 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                <li><Link to="/register" className="hover:text-blue-400 transition-colors">Book Appointment</Link></li>
                <li><Link to="/login" className="hover:text-blue-400 transition-colors">Patient Login</Link></li>
                <li><a href="#contact" className="hover:text-blue-400 transition-colors">Emergency Contact</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Contact</p>
              <div className="space-y-2.5 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                {[
                  [Phone,   "+94 117 000 000"],
                  [Mail,    "info@smartcarehub.lk"],
                  [MapPin,  "Colombo 3, Sri Lanka"],
                  [Clock,   "Emergency: 24/7"],
                ].map(([icon, text]) => {
                  const IconComponent = icon;

                  return (
                    <div key={text} className="flex items-center gap-2">
                      <IconComponent size={14} style={{ color: "#2F80ED" }} />
                      <span>{text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
              © 2026 Healio Medical. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              <Shield size={13} style={{ color: "#2F80ED" }} />
              HIPAA Compliant · 256-bit SSL · Secure Platform
            </div>
          </div>
        </PageContainer>
      </footer>
    </div>
  );
};

export default LandingPage;
