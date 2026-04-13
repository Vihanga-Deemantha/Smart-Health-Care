import { motion as Motion } from "framer-motion";

const StatsCard = ({ label, value, detail, accent = "linear-gradient(135deg, #2F80ED, #56CCF2)" }) => {
  return (
    <Motion.div
      whileHover={{ y: -3 }}
      className="rounded-[24px] border border-[#E0E7EF] bg-white p-5 shadow-[0_10px_30px_rgba(47,128,237,0.08)]"
    >
      <div className="h-1.5 w-16 rounded-full" style={{ background: accent }} />
      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#5C708A]">{label}</p>
      <p className="mt-3 text-4xl font-black tracking-tight text-[#0B1F3A]">{value}</p>
      {detail ? <p className="mt-2 text-sm leading-6 text-[#5C708A]">{detail}</p> : null}
    </Motion.div>
  );
};

export default StatsCard;
