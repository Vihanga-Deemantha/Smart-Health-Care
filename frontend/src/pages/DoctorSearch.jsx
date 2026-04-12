import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/axios.js";
import { getApiErrorMessage } from "../utils/getApiErrorMessage.js";

const DoctorSearch = () => {
  const [filters, setFilters] = useState({ specialization: "", hospital: "", language: "", mode: "TELEMEDICINE" });
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState("");

  const onChange = (event) => {
    setFilters((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const search = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/doctors", { params: filters });
      setDoctors(response.data?.data || []);
    } catch (err) {
      setDoctors([]);
      setError(getApiErrorMessage(err, "Doctor search is currently unavailable."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Find Your Doctor</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(220px, 1fr))", gap: 12 }}>
        <input name="specialization" placeholder="Specialization" value={filters.specialization} onChange={onChange} />
        <input name="hospital" placeholder="Hospital" value={filters.hospital} onChange={onChange} />
        <input name="language" placeholder="Language" value={filters.language} onChange={onChange} />
        <select name="mode" value={filters.mode} onChange={onChange}>
          <option value="TELEMEDICINE">Telemedicine</option>
          <option value="IN_PERSON">In Person</option>
        </select>
      </div>
      <button onClick={search} disabled={loading} style={{ marginTop: 12 }}>
        {loading ? "Searching..." : "Search"}
      </button>

      {error ? (
        <p style={{ marginTop: 12, color: "#f87171" }}>{error}</p>
      ) : null}

      <ul style={{ marginTop: 24 }}>
        {doctors.map((doctor) => (
          <li key={doctor.id || doctor._id} style={{ marginBottom: 12 }}>
            <strong>{doctor.name || doctor.fullName || "Doctor"}</strong>
            <div>{doctor.specialization || "General"}</div>
            <Link
              to={`/patient/book-appointment?doctorId=${doctor.id || doctor._id}&mode=${filters.mode}`}
              style={{ display: "inline-block", marginTop: 6 }}
            >
              Book Appointment
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DoctorSearch;
