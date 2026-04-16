import { TIME_OPTIONS, formatTime } from "../../utils/timeOptions.js";

const controlStyle = {
  backgroundColor: "#0d1117",
  border: "1px solid #30363d",
  color: "#e6edf3",
  borderRadius: "10px",
  padding: "8px 10px",
  fontSize: "14px"
};

const labelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.16em",
  color: "#8b949e"
};

const SlotRow = ({ slot, onChange, onRemove }) => {
  const handleChange = (field) => (event) => {
    const value = event.target.value;
    onChange({
      [field]: field === "duration" ? Number(value) : value
    });
  };

  return (
    <div
      className="grid gap-3"
      style={{
        gridTemplateColumns: "1.2fr 1fr 1fr 1fr 1fr auto",
        alignItems: "end"
      }}
    >
      <label style={labelStyle}>
        Weekday
        <span style={{ color: "#e6edf3", fontSize: "14px", textTransform: "none" }}>
          {slot.weekday}
        </span>
      </label>

      <label style={labelStyle}>
        Start time
        <select value={slot.startTime} onChange={handleChange("startTime")} style={controlStyle}>
          {TIME_OPTIONS.map((time) => (
            <option key={time} value={time}>
              {formatTime(time)}
            </option>
          ))}
        </select>
      </label>

      <label style={labelStyle}>
        End time
        <select value={slot.endTime} onChange={handleChange("endTime")} style={controlStyle}>
          {TIME_OPTIONS.map((time) => (
            <option key={time} value={time}>
              {formatTime(time)}
            </option>
          ))}
        </select>
      </label>

      <label style={labelStyle}>
        Duration
        <select value={slot.duration} onChange={handleChange("duration")} style={controlStyle}>
          {[15, 30, 45, 60].map((value) => (
            <option key={value} value={value}>
              {value} min
            </option>
          ))}
        </select>
      </label>

      <label style={labelStyle}>
        Mode
        <select value={slot.mode} onChange={handleChange("mode")} style={controlStyle}>
          <option value="TELEMEDICINE">TELEMEDICINE</option>
          <option value="IN_PERSON">IN_PERSON</option>
        </select>
      </label>

      <button
        type="button"
        onClick={onRemove}
        style={{
          border: "1px solid #30363d",
          background: "transparent",
          color: "#f85149",
          padding: "8px 12px",
          borderRadius: "10px",
          fontSize: "12px",
          textTransform: "uppercase",
          letterSpacing: "0.2em"
        }}
      >
        Remove
      </button>
    </div>
  );
};

export default SlotRow;
