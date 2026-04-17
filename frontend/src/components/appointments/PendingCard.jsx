import { useMemo } from "react";
import Avatar from "../common/Avatar.jsx";

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

const PendingCard = ({ appointment, onView, busy, isExiting }) => {
  const rawPatient = appointment?.patient;
  const patient = rawPatient && typeof rawPatient === "object" ? rawPatient : {};
  const patientName =
    patient.fullName ||
    patient.name ||
    appointment?.patientName ||
    appointment?.patientFullName ||
    "Patient";
  const mode = appointment?.mode || "IN_PERSON";
  const timeLabel = useMemo(
    () => formatTime(appointment?.startTime || appointment?.appointmentDate),
    [appointment?.startTime, appointment?.appointmentDate]
  );

  const handleView = () => {
    if (busy) {
      return;
    }
    onView?.(appointment);
  };

  return (
    <div
      className="rounded-xl border border-[#30363d] transition hover:border-[#00b4c8]"
      style={{
        background: "#161b22",
        padding: isExiting ? 0 : "16px 20px",
        marginBottom: isExiting ? 0 : 8,
        opacity: isExiting ? 0 : 1,
        maxHeight: isExiting ? 0 : 220,
        overflow: "hidden",
        transform: isExiting ? "translateX(12px)" : "translateX(0)",
        transition: "all 0.2s ease"
      }}
    >
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-[120px]">
          <p className="text-sm font-semibold" style={{ color: "#00b4c8" }}>
            {timeLabel || "--"}
          </p>
          <span
            className="mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px]"
            style={modeStyles[mode] || modeStyles.IN_PERSON}
          >
            {mode}
          </span>
        </div>

        <div className="flex flex-1 items-center gap-3">
          <Avatar src={patient.profilePhoto} name={patientName} size={44} />
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: "#e6edf3" }}>
              {patientName}
            </p>
            {appointment?.reason ? (
              <p
                className="text-xs"
                style={{
                  color: "#8b949e",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
              >
                Reason: {appointment.reason}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-label="View appointment details"
            onClick={handleView}
            disabled={busy}
            className="rounded-lg px-3 py-2 text-sm font-semibold"
            style={{ background: "#00b4c8", color: "#0d1117" }}
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingCard;
