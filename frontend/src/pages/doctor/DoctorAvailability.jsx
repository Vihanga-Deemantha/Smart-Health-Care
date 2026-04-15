import { useEffect, useState } from "react";
import api from "../../api/axios.js";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";

const weekdays = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" }
];

const emptySlot = {
  weekday: 1,
  startHour: 9,
  endHour: 17,
  slotDurationMinutes: 30,
  mode: "IN_PERSON"
};

const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Something went wrong.";

const DoctorAvailability = () => {
  const [slots, setSlots] = useState([emptySlot]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const updateSlot = (index, key, value) => {
    setSlots((current) =>
      current.map((slot, slotIndex) =>
        slotIndex === index ? { ...slot, [key]: value } : slot
      )
    );
  };

  const addSlot = () => {
    setSlots((current) => [...current, { ...emptySlot }]);
  };

  const removeSlot = (index) => {
    setSlots((current) => current.filter((_, slotIndex) => slotIndex !== index));
  };

  const resolveDoctorId = async () => {
    const storedUserId = localStorage.getItem("userId");

    if (!storedUserId) {
      return null;
    }

    const response = await api.get("/api/doctors");
    const doctors = response.data?.data?.doctors || response.data?.doctors || [];
    const match = doctors.find((doctor) => String(doctor.userId) === String(storedUserId));

    return match?._id || null;
  };

  const ensureDoctorProfile = async () => {
    const existingId = await resolveDoctorId();

    if (existingId) {
      return existingId;
    }

    const meResponse = await api.get("/api/auth/me");
    const user = meResponse.data?.data?.user;

    if (!user?.id || !user?.medicalLicenseNumber) {
      throw new Error("Doctor profile not found. Please complete your doctor registration.");
    }

    const createPayload = {
      userId: user.id,
      licenseNumber: user.medicalLicenseNumber,
      specialties: user.specialization ? [user.specialization] : [],
      contactNumber: user.phone || null,
      isAvailable: true
    };

    const created = await api.post("/api/doctors", createPayload);
    const doctor = created.data?.data?.doctor || created.data?.doctor;

    if (!doctor?._id) {
      throw new Error("Unable to create doctor profile. Please contact support.");
    }

    return doctor._id;
  };

  const loadAvailability = async () => {
    setLoading(true);
    setError("");

    try {
      const doctorId = await resolveDoctorId();

      if (!doctorId) {
        setSlots([emptySlot]);
        return;
      }

      const response = await api.get(`/api/doctors/${doctorId}`);
      const doctor = response.data?.data?.doctor || response.data?.doctor;
      const availability = doctor?.availability || [];

      if (!availability.length) {
        setSlots([emptySlot]);
        return;
      }

      const normalized = availability.map((slot) => ({
        weekday: Number(slot.weekday ?? 1),
        startHour: Number(slot.startHour ?? 9),
        endHour: Number(slot.endHour ?? 17),
        slotDurationMinutes: Number(slot.slotDurationMinutes ?? 30),
        mode: slot.mode || "IN_PERSON"
      }));

      setSlots(normalized);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvailability();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const doctorId = await ensureDoctorProfile();

      if (!doctorId) {
        throw new Error("Doctor ID not found. Please login again.");
      }

      await api.patch(`/api/doctors/${doctorId}/availability`, {
        availability: slots.map((slot) => ({
          weekday: Number(slot.weekday),
          startHour: Number(slot.startHour),
          endHour: Number(slot.endHour),
          slotDurationMinutes: Number(slot.slotDurationMinutes),
          mode: slot.mode
        }))
      });

      setSuccess("Availability saved successfully.");
      await loadAvailability();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-6">
        <h2 className="text-xl font-semibold text-white">Availability</h2>
        <p className="text-sm text-slate-400">
          Add your working slots for in-person or telemedicine appointments.
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-6">
          <LoadingSpinner label="Loading availability..." />
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {success}
        </div>
      ) : null}

      <div className="space-y-4">
        {slots.map((slot, index) => (
          <div
            key={`${slot.weekday}-${index}`}
            className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5"
          >
            <div className="grid gap-4 md:grid-cols-5">
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Weekday
                <select
                  value={slot.weekday}
                  onChange={(event) => updateSlot(index, "weekday", event.target.value)}
                  className="rounded-xl border border-slate-800/80 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                >
                  {weekdays.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Start hour
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={slot.startHour}
                  onChange={(event) => updateSlot(index, "startHour", event.target.value)}
                  className="rounded-xl border border-slate-800/80 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                />
              </label>

              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                End hour
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={slot.endHour}
                  onChange={(event) => updateSlot(index, "endHour", event.target.value)}
                  className="rounded-xl border border-slate-800/80 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                />
              </label>

              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Duration (min)
                <input
                  type="number"
                  min="10"
                  max="120"
                  value={slot.slotDurationMinutes}
                  onChange={(event) => updateSlot(index, "slotDurationMinutes", event.target.value)}
                  className="rounded-xl border border-slate-800/80 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                />
              </label>

              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Mode
                <select
                  value={slot.mode}
                  onChange={(event) => updateSlot(index, "mode", event.target.value)}
                  className="rounded-xl border border-slate-800/80 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                >
                  <option value="IN_PERSON">IN_PERSON</option>
                  <option value="TELEMEDICINE">TELEMEDICINE</option>
                </select>
              </label>
            </div>

            {slots.length > 1 ? (
              <button
                type="button"
                onClick={() => removeSlot(index)}
                className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-rose-300"
              >
                Remove slot
              </button>
            ) : null}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={addSlot}
          className="rounded-xl border border-slate-700/70 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-[#01696f]/40 hover:text-[#7be0e6]"
        >
          Add slot
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-[#01696f] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#028a93] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? <LoadingSpinner label="Saving..." /> : "Save availability"}
        </button>
      </div>
    </div>
  );
};

export default DoctorAvailability;
