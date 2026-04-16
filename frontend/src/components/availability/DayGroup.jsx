import SlotRow from "./SlotRow.jsx";

const badgeStyle = {
  borderRadius: "999px",
  padding: "2px 10px",
  fontSize: "12px",
  background: "rgba(0, 180, 200, 0.15)",
  color: "#7be0e6"
};

const DayGroup = ({
  day,
  slots,
  isOff,
  onToggleOff,
  onAddSlot,
  onChangeSlot,
  onRemoveSlot
}) => {
  return (
    <section
      className="rounded-2xl p-5"
      style={{
        background: isOff
          ? "linear-gradient(135deg, rgba(248,81,73,0.18), rgba(22,27,34,0.9))"
          : "linear-gradient(135deg, rgba(22,27,34,1), rgba(13,17,23,0.95))",
        border: "1px solid #30363d"
      }}
    >
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold" style={{ color: "#e6edf3" }}>
            {day}
          </h3>
          <span style={badgeStyle}>{slots.length} slots</span>
        </div>

        <div className="flex items-center gap-4">
          {isOff ? (
            <span style={{ color: "#f85149", fontWeight: 600 }}>🚫 Not available</span>
          ) : null}
          <label className="flex items-center gap-2 text-sm" style={{ color: "#c9d1d9" }}>
            <input
              type="checkbox"
              checked={isOff}
              onChange={() => onToggleOff(day)}
              className="h-4 w-4"
            />
            Day off
          </label>
        </div>
      </header>

      {!isOff ? (
        <div className="mt-4 space-y-4">
          {slots.length ? (
            slots.map((slot) => (
              <SlotRow
                key={slot.id}
                slot={slot}
                onChange={(updates) => onChangeSlot(slot.id, updates)}
                onRemove={() => onRemoveSlot(slot.id)}
              />
            ))
          ) : (
            <p style={{ color: "#8b949e", fontSize: "14px" }}>
              No slots yet. Add a time range for {day}.
            </p>
          )}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onAddSlot(day)}
          disabled={isOff}
          style={{
            border: "1px solid #30363d",
            background: isOff ? "rgba(22,27,34,0.4)" : "transparent",
            color: isOff ? "#6e7681" : "#e6edf3",
            padding: "8px 14px",
            borderRadius: "10px",
            fontSize: "13px",
            textTransform: "uppercase",
            letterSpacing: "0.16em",
            cursor: isOff ? "not-allowed" : "pointer"
          }}
        >
          Add slot
        </button>
      </div>
    </section>
  );
};

export default DayGroup;
