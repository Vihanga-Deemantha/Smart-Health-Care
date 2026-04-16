const formatDateTime = (value) => {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  const datePart = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(date);

  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);

  return `${datePart} - ${timePart}`;
};

const modeStyles = {
  TELEMEDICINE: {
    background: "#0d2e3a",
    color: "#00b4c8",
    border: "1px solid #00b4c8"
  },
  IN_PERSON: {
    background: "#0d1f3a",
    color: "#58a6ff",
    border: "1px solid #58a6ff"
  }
};

const UpcomingCard = ({ appointment, onViewDetails, onJoinCall, canJoin }) => {
  const patientName = appointment?.patient?.fullName || "Patient";
  const mode = appointment?.mode || "IN_PERSON";

  return (
    <div
      className="rounded-2xl border p-5 transition hover:border-[#00b4c8]"
      style={{ borderColor: "#30363d", background: "#161b22" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="text-lg font-semibold" style={{ color: "#e6edf3" }}>
            {patientName}
          </h4>
          <p className="text-sm" style={{ color: "#8b949e" }}>
            {formatDateTime(appointment?.startTime || appointment?.appointmentDate)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-3 py-1 text-xs"
            style={modeStyles[mode] || modeStyles.IN_PERSON}
          >
            {mode}
          </span>
          <span
            className="rounded-full border px-3 py-1 text-xs"
            style={{ borderColor: "#3fb950", color: "#3fb950", background: "#1a3d22" }}
          >
            CONFIRMED
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          aria-label="View appointment details"
          onClick={onViewDetails}
          className="rounded-lg border px-4 py-2 text-sm font-semibold"
          style={{ borderColor: "#30363d", color: "#e6edf3", background: "#21262d" }}
        >
          View Details
        </button>
        {canJoin ? (
          <button
            type="button"
            aria-label="Join video call"
            onClick={() => onJoinCall?.(appointment)}
            className="rounded-lg px-4 py-2 text-sm font-semibold"
            style={{ background: "#00b4c8", color: "#0d1117" }}
          >
            Join Video Call
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default UpcomingCard;
