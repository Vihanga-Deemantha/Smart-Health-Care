import { HeartPulse } from "lucide-react";

const Logo = ({ compact = false, showEyebrow = true, showSubtitle = true, theme = "dark" }) => {
  const eyebrowClass = theme === "dark" ? "text-cyan-300/80" : "text-[#5C708A]";
  const subtitleClass = theme === "dark" ? "text-white" : "text-[#0B1F3A]";

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-cyan-400 via-blue-500 to-emerald-400 text-slate-950 shadow-[0_20px_45px_-24px_rgba(34,211,238,0.85)]">
        <HeartPulse size={compact ? 16 : 20} strokeWidth={2.3} />
      </div>
      <div>
        {showEyebrow ? (
          <p className={`text-[10px] font-semibold uppercase tracking-[0.34em] ${eyebrowClass}`}>
            Smart Healthcare
          </p>
        ) : null}
        {showSubtitle ? (
          <p className={`text-lg font-semibold tracking-tight ${subtitleClass}`}>
            Secure Care Hub
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default Logo;
