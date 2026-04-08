import { formatDate } from "../../utils/formatDate.js";

const formatActionLabel = (value) =>
  value
    ?.toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const SecurityActivityCard = ({ action }) => {
  return (
    <div className="rounded-[24px] border border-white/10 bg-slate-900/80 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{formatActionLabel(action.action)}</p>
          <p className="mt-1 text-xs text-slate-500">Admin: {action.adminUserId}</p>
        </div>
        <span className="text-xs text-slate-500">{formatDate(action.createdAt)}</span>
      </div>
      <p className="mt-3 text-sm text-slate-300">Target user: {action.targetUserId}</p>
      {action.reason ? <p className="mt-2 text-sm text-slate-400">{action.reason}</p> : null}
    </div>
  );
};

export default SecurityActivityCard;
