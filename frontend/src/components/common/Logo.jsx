import { HeartPulse } from "lucide-react";

const Logo = ({ compact = false }) => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-cyan-400 via-blue-500 to-emerald-400 text-slate-950 shadow-[0_20px_45px_-24px_rgba(34,211,238,0.85)]">
        <HeartPulse size={compact ? 16 : 20} strokeWidth={2.3} />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-cyan-300/80">
          Smart Healthcare
        </p>
        <p className="text-lg font-semibold tracking-tight text-white">
          Secure Care Hub
        </p>
      </div>
    </div>
  );
};

export default Logo;
