import { motion } from "framer-motion";

const StatsCard = ({ label, value, accent = "from-cyan-400 to-blue-500" }) => {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6 shadow-[0_30px_80px_-40px_rgba(6,182,212,0.45)]"
    >
      <div className={`h-1.5 w-20 rounded-full bg-linear-to-r ${accent}`} />
      <p className="mt-5 text-sm text-slate-300">{label}</p>
      <p className="mt-3 text-4xl font-semibold tracking-tight text-white">{value}</p>
    </motion.div>
  );
};

export default StatsCard;
