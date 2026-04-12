const styles = {
  ACTIVE: "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/20",
  SUSPENDED: "bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/20",
  PENDING: "bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/20",
  LOCKED: "bg-orange-500/15 text-orange-200 ring-1 ring-orange-400/20",
  APPROVED: "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/20",
  CHANGES_REQUESTED: "bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/20",
  REJECTED: "bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/20",
  PATIENT: "bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-400/20",
  DOCTOR: "bg-blue-500/15 text-blue-200 ring-1 ring-blue-400/20",
  ADMIN: "bg-fuchsia-500/15 text-fuchsia-200 ring-1 ring-fuchsia-400/20"
};

const StatusBadge = ({ value }) => {
  const label = value || "UNKNOWN";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[label] || "bg-slate-800 text-slate-200 ring-1 ring-white/10"}`}>
      {label}
    </span>
  );
};

export default StatusBadge;
