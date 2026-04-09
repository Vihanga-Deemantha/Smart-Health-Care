import { ShieldCheck, Stethoscope, UserRoundCheck } from "lucide-react";
import Logo from "../common/Logo.jsx";
import heroImage from "../../assets/hero.png";

const highlights = [
  {
    icon: ShieldCheck,
    title: "Security-led access",
    text: "Protected sessions, OTP verification, and operational controls support a safer sign-in experience."
  },
  {
    icon: Stethoscope,
    title: "Built for clinical teams",
    text: "Patient onboarding and doctor review flows are shaped for real healthcare operations."
  },
  {
    icon: UserRoundCheck,
    title: "Operational clarity",
    text: "Registration, approvals, and security activity stay connected inside one interface."
  }
];

const AuthSidePanel = () => {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/80 p-8 shadow-[0_40px_100px_-45px_rgba(6,182,212,0.55)] lg:p-10">
      <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-r from-cyan-400/20 via-blue-500/15 to-emerald-400/15 blur-3xl" />
      <div className="relative">
        <Logo />
        <p className="mt-12 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
          Trusted healthcare access
        </p>
        <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Secure digital access for every care journey.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
          Smart Care Health gives patients, doctors, and administrators a cleaner way to access care workflows and platform operations.
        </p>

        <div className="mt-8 overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/70">
          <img
            src={heroImage}
            alt="Care team reviewing digital health information"
            className="h-48 w-full object-cover"
          />
        </div>

        <div className="mt-10 space-y-4">
          {highlights.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-800 text-cyan-300">
                  <Icon size={20} />
                </div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuthSidePanel;
