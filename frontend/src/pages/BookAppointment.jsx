import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/axios.js";
import { getApiErrorMessage } from "../utils/getApiErrorMessage.js";

const BookAppointment = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const doctorId = params.get("doctorId");
  const mode = params.get("mode") || "TELEMEDICINE";

  const defaultStart = useMemo(() => new Date(Date.now() + 24 * 60 * 60 * 1000), []);
  const defaultEnd = useMemo(() => new Date(defaultStart.getTime() + 30 * 60 * 1000), [defaultStart]);

  const [form, setForm] = useState({
    doctorId: doctorId || "",
    startTime: defaultStart.toISOString(),
    endTime: defaultEnd.toISOString(),
    reason: "",
    mode
  });
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");

  const onChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const submit = async () => {
    setBooking(true);
    setError("");
    try {
      const holdResponse = await api.post("/appointments/hold", {
        doctorId: form.doctorId,
        startTime: form.startTime,
        endTime: form.endTime
      });
      const holdId = holdResponse.data?.data?._id;

      if (!holdId) {
        throw new Error("Could not hold slot");
      }

      const appointmentResponse = await api.post("/appointments", {
        holdId,
        doctorId: form.doctorId,
        mode: form.mode,
        reason: form.reason
      });

      const appointment = appointmentResponse.data?.data;

      if (!appointment?._id) {
        throw new Error("Appointment booking failed");
      }

      navigate(`/patient/checkout?appointmentId=${appointment._id}&doctorId=${form.doctorId}`);
    } catch (error) {
      setError(getApiErrorMessage(error, "Appointment booking failed"));
    } finally {
      setBooking(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Book Appointment</h1>
      <div style={{ display: "grid", gap: 12, maxWidth: 520 }}>
        <input name="doctorId" value={form.doctorId} onChange={onChange} placeholder="Doctor ID" />
        <label>
          Consultation Mode
          <select name="mode" value={form.mode} onChange={onChange}>
            <option value="TELEMEDICINE">Telemedicine</option>
            <option value="IN_PERSON">In Person</option>
          </select>
        </label>
        <label>
          Start Time (ISO)
          <input name="startTime" value={form.startTime} onChange={onChange} />
        </label>
        <label>
          End Time (ISO)
          <input name="endTime" value={form.endTime} onChange={onChange} />
        </label>
        <textarea name="reason" value={form.reason} onChange={onChange} placeholder="Reason for consultation" />
      </div>
      <button onClick={submit} disabled={booking} style={{ marginTop: 12 }}>
        {booking ? "Booking..." : "Reserve & Continue"}
      </button>
      {error ? (
        <p style={{ marginTop: 12, color: "#f87171" }}>{error}</p>
      ) : null}
      <div style={{ marginTop: 12 }}>
        <Link to="/patient/find-doctor">Back to Search</Link>
      </div>
    </div>
  );
};

export default BookAppointment;
