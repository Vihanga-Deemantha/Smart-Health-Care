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
  const tone = isAuthLog
    ? {
        badge: "bg-[#EEF7FF] text-[#2F80ED] ring-[#CFE2FF]",
        border: "border-[#D9E9FF]",
        glow: "shadow-[0_10px_30px_rgba(47,128,237,0.08)]"
      }
    : {
        badge: "bg-[#ECF8F1] text-[#1F7A46] ring-[#CBEED8]",
        border: "border-[#DDEFE6]",
        glow: "shadow-[0_10px_30px_rgba(47,128,237,0.08)]"
      };

  return (
    <div className={`rounded-[24px] border bg-white p-5 ${tone.border} ${tone.glow}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-[#1D2D50]">{formatActionLabel(item.action)}</p>
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] ring-1 ${tone.badge}`}
            >
              {isAuthLog ? "AUTH" : "ADMIN"}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#5C708A]">
            {isAuthLog
              ? `Actor: ${item.actorEmail || item.actorUserId || "Unknown user"}`
              : `Admin: ${item.actorUserId || "Unknown admin"}`}
          </p>
        </div>
        <span className="text-xs text-[#5C708A]">{formatDate(item.createdAt)}</span>
      </div>

      {item.targetUserId ? (
        <p className="mt-3 text-sm text-[#4A6078]">Target user: {item.targetUserId}</p>
      ) : null}

      {item.ipAddress ? (
        <p className="mt-2 text-sm text-[#5C708A]">IP address: {item.ipAddress}</p>
      ) : null}

      {item.userAgent ? (
        <p className="mt-2 break-words text-sm text-[#5C708A]">User agent: {item.userAgent}</p>
      ) : null}

      {metadataEntries.length ? (
        <div className="mt-3 flex flex-wrap gap-2 text-sm text-[#4A6078]">
          {metadataEntries.map(([key, value]) => (
            <span
              key={key}
              className="rounded-full border border-[#E0E7EF] bg-[#F9FBFF] px-3 py-1.5 text-xs"
            >
              {formatActionLabel(key)}: {String(value)}
            </span>
          ))}
        </div>
      ) : null}

      {item.reason ? (
        <div className="mt-3 rounded-2xl border border-[#E0E7EF] bg-[#F9FBFF] px-4 py-3 text-sm text-[#4A6078]">
          {item.reason}
        </div>
      ) : null}
    </div>
  );
};

export default SecurityActivityCard;
