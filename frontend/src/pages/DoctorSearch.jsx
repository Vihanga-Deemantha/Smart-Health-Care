import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarPlus, Languages, MapPin, Monitor, Stethoscope } from "lucide-react";
import api from "../services/axios.js";
import { getApiErrorMessage } from "../utils/getApiErrorMessage.js";

const specializationOptions = [
  "",
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "ENT",
  "Family Medicine",
  "Gastroenterology",
  "General Medicine",
  "Gynecology",
  "Neurology",
  "Oncology",
  "Ophthalmology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Pulmonology",
  "Urology"
];

const languageOptions = [
  "",
  "English",
  "Spanish",
  "French",
  "German",
  "Hindi",
  "Tamil",
  "Sinhala",
  "Arabic",
  "Mandarin"
];

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
      setDoctors(response.data?.data?.doctors || response.data?.data || []);
    } catch (err) {
      setDoctors([]);
      setError(getApiErrorMessage(err, "Doctor search is currently unavailable."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-black text-white">Find Your Doctor</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Specialization</span>
          <select
            name="specialization"
            value={filters.specialization}
            onChange={onChange}
            className="rounded-xl border border-white/15 bg-slate-900/60 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-300/50"
          >
            {specializationOptions.map((option) => (
              <option key={option || "all-specializations"} value={option}>
                {option || "All Specializations"}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Hospital</span>
          <input
            name="hospital"
            placeholder="Any hospital"
            value={filters.hospital}
            onChange={onChange}
            className="rounded-xl border border-white/15 bg-slate-900/60 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Language</span>
          <select
            name="language"
            value={filters.language}
            onChange={onChange}
            className="rounded-xl border border-white/15 bg-slate-900/60 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-300/50"
          >
            {languageOptions.map((option) => (
              <option key={option || "all-languages"} value={option}>
                {option || "All Languages"}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Consultation Mode</span>
          <select
            name="mode"
            value={filters.mode}
            onChange={onChange}
            className="rounded-xl border border-white/15 bg-slate-900/60 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-300/50"
          >
            <option value="TELEMEDICINE">Telemedicine</option>
            <option value="IN_PERSON">In Person</option>
          </select>
        </label>
      </div>

      <button
        onClick={search}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Searching..." : "Search"}
      </button>

      {error ? (
        <p className="text-sm text-rose-300">{error}</p>
      ) : null}

      {doctors.length === 0 && !loading && !error ? (
        <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5 text-sm text-slate-300">
          No doctors found for current filters. Try selecting a different specialization or mode.
        </div>
      ) : null}

      <ul className="grid gap-4 pt-2 lg:grid-cols-2">
        {doctors.map((doctor) => {
          const doctorId = doctor.id || doctor._id;
          const fullName = doctor.name || doctor.fullName || "Doctor";
          const specialization =
            doctor.specialization ||
            (Array.isArray(doctor.specialties) && doctor.specialties.length > 0
              ? doctor.specialties[0]
              : "General");
          const language = doctor.language || doctor.preferredLanguage || "Not specified";
          const hospital = doctor.hospital || doctor.hospitalName || "Not specified";
          const availableModes = Array.isArray(doctor.availability)
            ? [...new Set(doctor.availability.map((item) => item?.mode).filter(Boolean))]
            : [];
          const bookingQuery = new URLSearchParams({
            doctorId: doctorId || "",
            mode: filters.mode,
            doctorName: fullName,
            specialization,
            language,
            hospital,
            availableModes: availableModes.join(",")
          }).toString();

          return (
            <li
              key={doctorId}
              className="group rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/75 to-slate-950/65 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-300/25 hover:shadow-lg hover:shadow-cyan-500/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-white">{fullName}</p>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                    <Stethoscope size={13} />
                    {specialization}
                  </div>
                </div>
                <div className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                  {filters.mode === "TELEMEDICINE" ? "Online" : "In Person"}
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <p className="flex items-center gap-2">
                  <Languages size={14} className="text-slate-400" />
                  <span>{language}</span>
                </p>
                <p className="flex items-center gap-2">
                  <MapPin size={14} className="text-slate-400" />
                  <span>{hospital}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Monitor size={14} className="text-slate-400" />
                  <span>{filters.mode === "TELEMEDICINE" ? "Telemedicine consultation" : "In-person consultation"}</span>
                </p>
              </div>

              <Link
                to={`/patient/book-appointment?${bookingQuery}`}
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-cyan-300/35 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition group-hover:border-cyan-200/50 group-hover:bg-cyan-400/15"
              >
                <CalendarPlus size={15} />
                Book Appointment
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default DoctorSearch;
