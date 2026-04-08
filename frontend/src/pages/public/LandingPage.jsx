import { ArrowRight, Shield, Sparkles, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PageContainer from "../../components/common/PageContainer.jsx";
import Logo from "../../components/common/Logo.jsx";

const cards = [
  {
    icon: Shield,
    title: "Secure identity flow",
    text: "Gateway-based routing, protected sessions, OTP verification, and role-aware access built for healthcare-grade trust."
  },
  {
    icon: Stethoscope,
    title: "Doctor onboarding control",
    text: "Professional registration, structured approvals, and admin review workflows designed for clinical operations."
  },
  {
    icon: Sparkles,
    title: "Premium admin visibility",
    text: "One polished command surface for user management, approvals, security activity, and dashboard metrics."
  }
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <PageContainer className="py-6">
        <header className="flex items-center justify-between gap-4">
          <Logo />
          <div className="flex gap-3">
            <Link
              to="/login"
              className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/5"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-2xl bg-linear-to-r from-cyan-400 via-blue-500 to-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950"
            >
              Get started
            </Link>
          </div>
        </header>

        <section className="grid gap-10 py-18 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
              Healthcare identity platform
            </p>
            <h1 className="mt-8 max-w-4xl text-5xl font-semibold tracking-tight text-white sm:text-6xl">
              Secure patient access and premium admin control through one elegant gateway.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              From patient registration to doctor approval and user oversight, SecureCare Hub delivers a polished healthcare frontend on top of your microservice architecture.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-cyan-400 via-blue-500 to-emerald-400 px-6 py-4 text-sm font-semibold text-slate-950 shadow-[0_25px_60px_-26px_rgba(34,211,238,0.8)]"
              >
                Start registration
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/login"
                className="rounded-2xl border border-white/10 px-6 py-4 text-sm font-medium text-white transition hover:bg-white/5"
              >
                Sign in securely
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-4"
          >
            {cards.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-[30px] border border-white/10 bg-slate-900/80 p-6 shadow-[0_30px_100px_-45px_rgba(6,182,212,0.5)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-cyan-300">
                  <Icon size={22} />
                </div>
                <h2 className="mt-5 text-2xl font-semibold text-white">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">{text}</p>
              </div>
            ))}
          </motion.div>
        </section>
      </PageContainer>
    </div>
  );
};

export default LandingPage;
