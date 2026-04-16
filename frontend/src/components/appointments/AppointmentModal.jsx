import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "../common/Avatar.jsx";

const formatDateTime = (value) => {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
};

const formatAppointmentId = (id) => {
  if (!id) {
    return "APT-0000";
  }

  return `APT-${String(id).slice(-4).toUpperCase()}`;
};

const AppointmentModal = ({
  appointment,
  onClose,
  onJoinCall,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  primaryActionDisabled,
  secondaryActionDisabled,
  hideDefaultActions = false,
  showReasonInput = false,
  reasonValue = "",
  onReasonChange,
  reasonPlaceholder = "Reason (optional)"
}) => {
  const navigate = useNavigate();
  const modalRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const patient = appointment?.patient || {};
  const mode = appointment?.mode || "IN_PERSON";
  const appointmentDate = appointment?.startTime || appointment?.appointmentDate;

  const createdAtLabel = useMemo(
    () => formatDateTime(appointment?.createdAt),
    [appointment?.createdAt]
  );
  const appointmentId = appointment?._id || appointment?.id || "";

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) {
      return undefined;
    }

    const focusableSelector =
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";
    const focusable = Array.from(modal.querySelectorAll(focusableSelector));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onCloseRef.current?.();
        return;
      }

      if (event.key !== "Tab" || focusable.length === 0) {
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    first?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleViewReports = () => {
    if (!appointmentId) {
      return;
    }

    navigate(`/doctor/consultation/${appointmentId}`);
  };

  const handleWritePrescription = () => {
    if (!appointmentId) {
      return;
    }

    navigate(`/doctor/prescription/${appointmentId}`);
  };

  const handleOverlayMouseDown = (event) => {
    if (event.target === event.currentTarget) {
      onCloseRef.current?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0, 0, 0, 0.7)" }}
      onMouseDown={handleOverlayMouseDown}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-modal-title"
        className="w-full rounded-2xl border"
        style={{ maxWidth: "560px", background: "#161b22", borderColor: "#30363d" }}
      >
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: "#30363d" }}
        >
          <h3 id="appointment-modal-title" className="text-lg font-semibold">
            Appointment Details
          </h3>
          <button
            type="button"
            aria-label="Close appointment details"
            onClick={() => onCloseRef.current?.()}
            className="text-sm"
            style={{ color: "#8b949e" }}
          >
            X
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <section>
            <h4 className="text-sm font-semibold" style={{ color: "#8b949e" }}>
              Patient Information
            </h4>
            <div className="mt-3 flex items-center gap-3">
              <Avatar src={patient.profilePhoto} name={patient.fullName} size={46} />
              <div>
                <p className="text-base font-semibold" style={{ color: "#e6edf3" }}>
                  {patient.fullName || "Patient"}
                </p>
                <p className="text-sm" style={{ color: "#8b949e" }}>
                  {patient.email || "Not available"}
                </p>
                <p className="text-sm" style={{ color: "#8b949e" }}>
                  {patient.phone || "Not available"}
                </p>
              </div>
            </div>
          </section>

          <div style={{ borderTop: "1px solid #21262d" }} />

          <section>
            <h4 className="text-sm font-semibold" style={{ color: "#8b949e" }}>
              Appointment Information
            </h4>
            <div className="mt-3 space-y-2 text-sm">
              <p>Appointment ID: {formatAppointmentId(appointmentId)}</p>
              <p>Date and time: {formatDateTime(appointmentDate)}</p>
              <p>Mode: {mode}</p>
              <p>Status: {appointment?.status || "CONFIRMED"}</p>
              <p>Reason: {appointment?.reason || "Not provided"}</p>
              <p>Booked on: {createdAtLabel}</p>
            </div>
          </section>

          <div style={{ borderTop: "1px solid #21262d" }} />

          <section>
            <h4 className="text-sm font-semibold" style={{ color: "#8b949e" }}>
              Actions
            </h4>
            {showReasonInput ? (
              <div className="mt-3">
                <label className="text-xs font-semibold" style={{ color: "#8b949e" }}>
                  Rejection reason (optional)
                </label>
                <textarea
                  rows={2}
                  value={reasonValue}
                  onChange={(event) => onReasonChange?.(event.target.value)}
                  placeholder={reasonPlaceholder}
                  aria-label="Rejection reason"
                  className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                  style={{
                    borderColor: "#30363d",
                    background: "#0d1117",
                    color: "#e6edf3",
                    resize: "none"
                  }}
                />
              </div>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-3">
              {primaryActionLabel ? (
                <button
                  type="button"
                  aria-label={primaryActionLabel}
                  onClick={() => onPrimaryAction?.(appointment)}
                  disabled={primaryActionDisabled}
                  className="rounded-lg px-4 py-2 text-sm font-semibold"
                  style={{
                    background: "#238636",
                    color: "#ffffff",
                    opacity: primaryActionDisabled ? 0.7 : 1
                  }}
                >
                  {primaryActionLabel}
                </button>
              ) : null}
              {secondaryActionLabel ? (
                <button
                  type="button"
                  aria-label={secondaryActionLabel}
                  onClick={() => onSecondaryAction?.(appointment, reasonValue)}
                  disabled={secondaryActionDisabled}
                  className="rounded-lg border px-4 py-2 text-sm font-semibold"
                  style={{
                    borderColor: "#f85149",
                    color: "#f85149",
                    opacity: secondaryActionDisabled ? 0.7 : 1
                  }}
                >
                  {secondaryActionLabel}
                </button>
              ) : null}
              {!hideDefaultActions ? (
                <>
                  {mode === "TELEMEDICINE" ? (
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
                  <button
                    type="button"
                    aria-label="Write prescription"
                    onClick={handleWritePrescription}
                    className="rounded-lg border px-4 py-2 text-sm font-semibold"
                    style={{ borderColor: "#30363d", color: "#e6edf3" }}
                  >
                    Write Prescription
                  </button>
                  <button
                    type="button"
                    aria-label="View medical reports"
                    onClick={handleViewReports}
                    className="rounded-lg border px-4 py-2 text-sm font-semibold"
                    style={{ borderColor: "#30363d", color: "#e6edf3" }}
                  >
                    View Medical Reports
                  </button>
                </>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AppointmentModal;
