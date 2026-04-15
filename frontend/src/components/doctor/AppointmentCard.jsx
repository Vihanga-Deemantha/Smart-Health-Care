import { CalendarDays, CheckCircle2, User, Video, XCircle } from "lucide-react";

const statusStyles = {
  BOOKED: "bg-yellow-500/15 text-yellow-200 border border-yellow-400/30",
  CONFIRMED: "bg-emerald-500/15 text-emerald-200 border border-emerald-400/30",
  CANCELLED: "bg-rose-500/15 text-rose-200 border border-rose-400/30",
  COMPLETED: "bg-blue-500/15 text-blue-200 border border-blue-400/30"
};

const normalizeStatus = (value) => (value ? String(value).toUpperCase() : "UNKNOWN");

const formatDateTime = (value) => {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
};

const AppointmentCard = ({ appointment, onAccept, onReject, onJoinCall, busy = false }) => {
  const status = normalizeStatus(appointment?.status || appointment?.appointmentStatus);
  const mode = normalizeStatus(appointment?.mode || appointment?.visitMode || appointment?.consultationMode);
  const dateValue = appointment?.appointmentDate || appointment?.date || appointment?.startTime || appointment?.scheduledAt;
  const patientId = appointment?.patientId || appointment?.patient?._id || appointment?.patient?.id || "Unknown";
  const patientName = appointment?.patientName || appointment?.patient?.fullName || "Patient";
  const canRespond = status === "BOOKED";
  const canJoin = mode === "TELEMEDICINE" && status === "CONFIRMED";
  const badgeStyles = statusStyles[status] || "bg-slate-700/50 text-slate-200 border border-slate-600/40";

  return (
    <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5 shadow-[0_20px_50px_-30px_rgba(8,15,30,0.9)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
            Appointment
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">{patientName}</h3>
          <p className="mt-1 text-sm text-slate-300">Patient ID: {patientId}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeStyles}`}>
          {status}
        </span>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-slate-300">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-slate-400" />
          <span>{formatDateTime(dateValue)}</span>
        </div>
        <div className="flex items-center gap-2">
          <User size={16} className="text-slate-400" />
          <span>Mode: {mode || "IN_PERSON"}</span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {canRespond ? (
          <>
            <button
              type="button"
              onClick={() => onAccept?.(appointment)}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-[#01696f] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#028a93] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 size={16} />
              Accept
            </button>
            <button
              type="button"
              onClick={() => onReject?.(appointment)}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <XCircle size={16} />
              Reject
            </button>
          </>
        ) : null}

        {canJoin ? (
          <button
            type="button"
            onClick={() => onJoinCall?.(appointment)}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl border border-[#01696f]/40 bg-[#01696f]/10 px-4 py-2 text-sm font-semibold text-[#7be0e6] transition hover:bg-[#01696f]/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Video size={16} />
            Join Video Call
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default AppointmentCard;
