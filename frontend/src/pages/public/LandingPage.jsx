import { ArrowRight, Shield, Sparkles, Stethoscope, Activity, Users, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import PageContainer from "../../components/common/PageContainer.jsx";
import Logo from "../../components/common/Logo.jsx";
import healthHero from "../../assets/health_hero.png";
import doctorPlatform from "../../assets/doctor_platform.png";
import adminDashboard from "../../assets/admin_dashboard.png";

const features = [
  {
    icon: Shield,
    title: "Protected access",
    text: "JWT sessions, OTP verification, and gateway-based routing built for dependable healthcare access.",
  },
  {
    icon: Stethoscope,
    title: "Doctor onboarding",
    text: "Structured registration and approval workflows help clinical teams move from signup to review cleanly.",
  },
  {
    icon: Sparkles,
    title: "Admin visibility",
    text: "Operations teams can manage users, approvals, and security activity from one consistent dashboard.",
  }
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-cyan-500/30 overflow-hidden relative">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 -z-20" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-10" />
      
      <PageContainer className="py-6">
        <header className="flex items-center justify-between gap-4 relative z-10">
          <Logo />
          <div className="flex gap-3">
            <Link
              to="/login"
              className="rounded-full border border-white/10 bg-white/5 backdrop-blur-md px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/10 hover:border-white/20 hover:scale-105"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 px-6 py-2.5 text-sm font-bold text-slate-950 transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:scale-105"
            >
              Get Started
            </Link>
          </div>
        </header>

        <main className="pb-24">
          <section className="grid gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24 lg:items-center">
            <Motion.div 
               initial={{ opacity: 0, x: -30 }} 
               animate={{ opacity: 1, x: 0 }}
               transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                Next-Gen Healthcare Platform
              </div>
              
              <h1 className="mt-8 max-w-4xl text-5xl font-bold tracking-tight text-white lg:text-7xl leading-tight">
                Secure digital <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">care access</span> for everyone.
              </h1>
              
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
                Experience a polished healthcare interface designed for modern medical institutions. We bring registration, verification, clinician approval, and operational oversight into one unified ecosystem.
              </p>
              
              <div className="mt-10 flex flex-wrap items-center gap-5">
                <Link
                  to="/register"
                  className="group relative inline-flex items-center gap-2 rounded-full overflow-hidden bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 px-8 py-4 text-sm font-bold text-slate-950 transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)]"
                >
                  <span className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="relative flex items-center gap-2">
                    Start Onboarding
                    <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-4 text-sm font-medium text-white transition-colors hover:bg-white/10 hover:text-cyan-400"
                >
                  <Lock size={18} />
                  Secure Login
                </Link>
              </div>

              <div className="mt-14 flex items-center gap-8 border-t border-white/5 pt-8">
                <div className="flex flex-col gap-1">
                  <span className="text-3xl font-bold text-white">99.9%</span>
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Uptime</span>
                </div>
                <div className="h-10 w-px bg-white/10" />
                <div className="flex flex-col gap-1">
                  <span className="text-3xl font-bold text-white">256-bit</span>
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Encryption</span>
                </div>
                <div className="h-10 w-px bg-white/10" />
                <div className="flex flex-col gap-1">
                  <span className="text-3xl font-bold text-white">HIPAA</span>
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Compliant</span>
                </div>
              </div>
            </Motion.div>

            <Motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0, y: [0, -10, 0] }}
              transition={{ 
                opacity: { duration: 0.8, ease: "easeOut", delay: 0.2 },
                x: { duration: 0.8, ease: "easeOut", delay: 0.2 },
                y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
              }}
              className="relative"
            >
              <div className="absolute -inset-1 rounded-[40px] bg-gradient-to-r from-cyan-500 to-emerald-500 opacity-20 blur-2xl" />
              <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-900 shadow-2xl transition-transform duration-500 hover:scale-[1.02]">
                <img
                  src={healthHero}
                  alt="Premium Healthcare Interface Mockup"
                  className="h-[500px] w-full object-cover opacity-90 transition-opacity hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                
                <div className="absolute bottom-0 p-8 w-full">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 backdrop-blur-md border border-cyan-500/20">
                      <Activity size={20} />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-cyan-400">LIVE SYSTEM</p>
                      <p className="text-sm font-medium text-white">All services operational</p>
                    </div>
                  </div>
                </div>
              </div>
            </Motion.div>
          </section>

          <section className="py-10 border-y border-white/5 bg-white/[0.02]">
            <p className="text-center text-sm font-medium text-slate-500 uppercase tracking-widest mb-8">Trusted by leading healthcare institutions</p>
            <div className="flex flex-wrap justify-center gap-12 lg:gap-24 opacity-50 grayscale transition-all hover:grayscale-0 hover:opacity-100 duration-500">
              {['National Health', 'Medicare Plus', 'Carepoint', 'Global Med', 'Pulse Labs'].map((company, i) => (
                <div key={i} className="text-xl font-bold text-slate-300 font-serif flex items-center gap-2 transition-transform hover:scale-110 cursor-default">
                  <Activity size={24} className="text-cyan-500" />
                  {company}
                </div>
              ))}
            </div>
          </section>

          <section className="py-20 mt-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">Platform Features</h2>
              <p className="mt-4 text-slate-400 max-w-2xl mx-auto">Everything you need to manage your healthcare operations securely and efficiently.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <Motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="group relative rounded-3xl border border-white/5 bg-slate-900/50 p-8 backdrop-blur-md transition-colors hover:bg-slate-800/50 hover:border-white/10"
                >
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-500/5 to-emerald-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-cyan-400 border border-white/5 group-hover:scale-110 transition-transform">
                      <feature.icon size={24} />
                    </div>
                    <h3 className="mt-6 text-xl font-semibold text-white">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-400">{feature.text}</p>
                  </div>
                </Motion.div>
              ))}
            </div>
          </section>

          <section className="py-20">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <Motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="order-2 lg:order-1"
              >
                <div className="relative rounded-[32px] overflow-hidden border border-white/10 shadow-2xl">
                  <img src={doctorPlatform} alt="Doctor Portal Interface" className="w-full h-auto" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                </div>
              </Motion.div>
              
              <Motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="order-1 lg:order-2"
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-xs font-semibold text-blue-300">
                  <Users size={14} />
                  Clinical Excellence
                </div>
                <h2 className="mt-6 text-3xl font-bold text-white sm:text-4xl leading-tight">
                  Streamlined <span className="text-blue-400">Doctor Portals</span>
                </h2>
                <p className="mt-6 text-lg text-slate-400 leading-relaxed">
                  Provide your clinical staff with state-of-the-art tools. From seamless onboarding to patient management, our platform reduces administrative friction so doctors can focus on care.
                </p>
                <ul className="mt-8 space-y-4">
                  {["Automated credential verification", "Intuitive scheduling interface", "Secure direct messaging"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-300">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </Motion.div>
            </div>
          </section>

          <section className="py-20">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
               <Motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/20 bg-purple-400/10 px-4 py-2 text-xs font-semibold text-purple-300">
                  <Shield size={14} />
                  Operations Control
                </div>
                <h2 className="mt-6 text-3xl font-bold text-white sm:text-4xl leading-tight">
                  Comprehensive <span className="text-purple-400">Admin Dashboard</span>
                </h2>
                <p className="mt-6 text-lg text-slate-400 leading-relaxed">
                  Maintain full oversight over your healthcare ecosystem. Powerful analytics, role-based access control, and compliance auditing all accessible from a central command center.
                </p>
                <ul className="mt-8 space-y-4">
                  {["Real-time system telemetry", "Role-based access controls (RBAC)", "Action log auditing"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-300">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20 text-purple-400">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </Motion.div>

              <Motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="relative rounded-[32px] overflow-hidden border border-white/10 shadow-2xl">
                  <img src={adminDashboard} alt="Admin Analytics Dashboard" className="w-full h-auto" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                </div>
              </Motion.div>
            </div>
          </section>

          <section className="py-24 border-t border-white/10 text-center">
             <h2 className="text-3xl font-bold text-white sm:text-5xl max-w-3xl mx-auto">
               Ready to upgrade your digital healthcare infrastructure?
             </h2>
             <p className="mt-6 text-xl text-slate-400 max-w-2xl mx-auto">
               Join leading medical institutions that use Smart Care Health to power their patient and doctor experiences.
             </p>
             <div className="mt-12 flex justify-center gap-4 relative">
                <div className="absolute inset-0 max-w-fit mx-auto rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 blur-xl opacity-20 animate-pulse" />
                <Link
                  to="/register"
                  className="relative rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 px-12 py-5 text-sm font-bold text-slate-950 transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(34,211,238,0.5)]"
                >
                  Create an Account
                </Link>
             </div>
          </section>
        </main>
      </PageContainer>
    </div>
  );
};

export default LandingPage;
