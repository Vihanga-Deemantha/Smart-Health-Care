import { useState } from "react";

const RejectReasonInput = ({ onConfirm, onCancel, busy }) => {
  const [reason, setReason] = useState("");

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="text"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Reason for rejection"
        className="rounded-lg border px-3 py-2 text-sm"
        style={{
          borderColor: "#30363d",
          background: "#0d1117",
          color: "#e6edf3"
        }}
        aria-label="Rejection reason"
      />
      <button
        type="button"
        aria-label="Confirm reject appointment"
        onClick={() => onConfirm?.(reason)}
        disabled={busy}
        className="rounded-lg border px-3 py-2 text-sm font-semibold"
        style={{ borderColor: "#f85149", color: "#f85149" }}
      >
        Confirm Reject
      </button>
      <button
        type="button"
        aria-label="Cancel reject appointment"
        onClick={onCancel}
        className="rounded-lg border px-3 py-2 text-sm"
        style={{ borderColor: "#30363d", color: "#8b949e" }}
      >
        Cancel
      </button>
    </div>
  );
};

export default RejectReasonInput;
