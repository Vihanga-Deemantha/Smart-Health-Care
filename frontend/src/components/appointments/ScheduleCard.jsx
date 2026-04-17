const formatTime = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
};

const buildTimeRange = (startTime, endTime) => {
  const startLabel = formatTime(startTime);
  const endLabel = formatTime(endTime);

  if (!startLabel) {
    return "";
  }

  if (endLabel) {
    return `${startLabel} - ${endLabel}`;
  }

  return startLabel;
};

const ScheduleCard = ({ appointment, onViewDetails, onJoinCall, showJoin, isToday }) => {
  const patientName = appointment?.patient?.fullName || "Patient";
  const mode = appointment?.mode || "IN_PERSON";
  const specialty =
    appointment?.specialty ||
    appointment?.department ||
    appointment?.metadata?.specialty ||
    "General";
  const timeRange = buildTimeRange(appointment?.startTime, appointment?.endTime);
  const dotColor = isToday ? "#58a6ff" : "#3fb950";

  return (
    <div
      className="rounded-xl border border-[#30363d] p-4 transition hover:border-[#00b4c8]"
      style={{ background: "#161b22" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span
            className="inline-flex h-2 w-2 rounded-full"
            style={{ background: dotColor }}
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#00b4c8", minWidth: 140 }}>
              {timeRange}
            </p>
            <p className="text-base font-semibold" style={{ color: "#e6edf3" }}>
              {patientName}
            </p>
            <p className="text-xs" style={{ color: "#8b949e" }}>
              {mode} - {specialty}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-label="View appointment details"
            onClick={onViewDetails}
            className="rounded-lg border px-3 py-2 text-sm font-semibold"
            style={{ borderColor: "#30363d", color: "#e6edf3", background: "#21262d" }}
          >
            View Details
          </button>
          {showJoin ? (
            <button
              type="button"
              aria-label="Join video call"
              onClick={() => onJoinCall?.(appointment)}
              className="rounded-lg px-3 py-2 text-sm font-semibold"
              style={{
                background: "#00b4c8",
                color: "#0d1117",
                animation: "schedule-pulse 1.4s ease-in-out infinite"
              }}
            >
              Join Call
            </button>
          ) : null}
        </div>
      </div>

      <style>{
        "@keyframes schedule-pulse{0%{box-shadow:0 0 0 0 rgba(0,180,200,0.35)}70%{box-shadow:0 0 0 10px rgba(0,180,200,0)}100%{box-shadow:0 0 0 0 rgba(0,180,200,0)}}"
      }</style>
    </div>
  );
};

export default ScheduleCard;
