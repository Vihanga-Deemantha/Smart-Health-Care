import { formatDate } from "../../utils/formatDate.js";

const formatActionLabel = (value) =>
  value
    ?.toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const normalizeActivity = (activity) => {
  if (activity?.type) {
    return activity;
  }

  return {
    id: activity?._id || null,
    type: "ADMIN_ACTION",
    action: activity?.action,
    createdAt: activity?.createdAt,
    actorUserId: activity?.adminUserId || null,
    actorEmail: null,
    targetUserId: activity?.targetUserId || null,
    reason: activity?.reason || null,
    ipAddress: null,
    userAgent: null,
    metadata: {}
  };
};

const SecurityActivityCard = ({ activity }) => {
  const item = normalizeActivity(activity);
  const isAuthLog = item.type === "AUTH_LOG";
  const metadataEntries = Object.entries(item.metadata || {}).filter(
    ([, value]) => value !== null && value !== undefined && value !== ""
  );

  return (
    <div className="rounded-[24px] border border-white/10 bg-slate-900/80 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-white">{formatActionLabel(item.action)}</p>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] text-slate-400">
              {isAuthLog ? "AUTH" : "ADMIN"}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {isAuthLog
              ? `Actor: ${item.actorEmail || item.actorUserId || "Unknown user"}`
              : `Admin: ${item.actorUserId || "Unknown admin"}`}
          </p>
        </div>
        <span className="text-xs text-slate-500">{formatDate(item.createdAt)}</span>
      </div>

      {item.targetUserId ? (
        <p className="mt-3 text-sm text-slate-300">Target user: {item.targetUserId}</p>
      ) : null}

      {item.ipAddress ? (
        <p className="mt-2 text-sm text-slate-400">IP address: {item.ipAddress}</p>
      ) : null}

      {item.userAgent ? (
        <p className="mt-2 break-words text-sm text-slate-400">User agent: {item.userAgent}</p>
      ) : null}

      {metadataEntries.length ? (
        <div className="mt-3 space-y-1 text-sm text-slate-400">
          {metadataEntries.map(([key, value]) => (
            <p key={key}>
              {formatActionLabel(key)}: {String(value)}
            </p>
          ))}
        </div>
      ) : null}

      {item.reason ? <p className="mt-2 text-sm text-slate-400">{item.reason}</p> : null}
    </div>
  );
};

export default SecurityActivityCard;
