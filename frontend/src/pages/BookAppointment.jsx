import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CalendarClock, CalendarDays, Clock3, FileText, UserRound } from "lucide-react";
import PortalLayout from "../components/common/PortalLayout.jsx";
import PatientPortalNav from "../components/patient/PatientPortalNav.jsx";
import api from "../services/axios.js";
import { getApiErrorMessage } from "../utils/getApiErrorMessage.js";

const toDateInputValue = (dateValue) => {
  const date = new Date(dateValue);
  const timezoneOffset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
};

const formatSlotTime = (isoValue) =>
  new Date(isoValue).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });

const BookAppointment = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const doctorId = params.get("doctorId");
  const [doctorProfile, setDoctorProfile] = useState({
    name: params.get("doctorName") || "Selected Doctor",
    specialization: params.get("specialization") || "General",
    language: params.get("language") || "Not specified",
    hospital: params.get("hospital") || "Not specified"
  });
  const availableModes = (params.get("availableModes") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const mode = params.get("mode") || "TELEMEDICINE";

  const defaultSelectedDate = useMemo(() => toDateInputValue(Date.now() + 24 * 60 * 60 * 1000), []);

  const [form, setForm] = useState({
    doctorId: doctorId || "",
    startTime: "",
    endTime: "",
    reason: "",
    mode
  });
  const [selectedDate, setSelectedDate] = useState(defaultSelectedDate);
  const [slots, setSlots] = useState([]);
  const [selectedSlotKey, setSelectedSlotKey] = useState("");
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!doctorId) {
      navigate("/patient/find-doctor", { replace: true });
    }
  }, [doctorId, navigate]);

  useEffect(() => {
    const loadDoctorProfile = async () => {
      if (!doctorId) {
        return;
      }

      setDoctorLoading(true);

      try {
        const response = await api.get(`/doctors/${doctorId}`);
        const doctor = response.data?.data?.doctor || response.data?.data || {};

        const resolvedName = doctor.fullName || doctor.name || "Selected Doctor";
        const resolvedSpecialization =
          doctor.specialization ||
          (Array.isArray(doctor.specialties) && doctor.specialties.length > 0
            ? doctor.specialties[0]
            : doctorProfile.specialization || "General");
        const resolvedHospital = doctor.hospitalName || doctor.hospital || doctor.hospitalId || "Not specified";

        setDoctorProfile((prev) => ({
          ...prev,
          name: resolvedName,
          specialization: resolvedSpecialization,
          hospital: resolvedHospital
        }));
      } catch {
        // Keep query-derived values if doctor profile fetch fails.
      } finally {
        setDoctorLoading(false);
      }
    };

    loadDoctorProfile();
  }, [doctorId]);

  useEffect(() => {
    if (availableModes.length === 0) {
      return;
    }

    if (!availableModes.includes(form.mode)) {
      setForm((prev) => ({
        ...prev,
        mode: availableModes[0],
        startTime: "",
        endTime: ""
      }));
      setSelectedSlotKey("");
    }
  }, [availableModes, form.mode]);

  const doctorReference = useMemo(() => {
    if (!form.doctorId) {
      return "N/A";
    }

    return `DR-${form.doctorId.slice(-6).toUpperCase()}`;
  }, [form.doctorId]);

  useEffect(() => {
    const loadSlots = async () => {
      if (!form.doctorId || !selectedDate) {
        setSlots([]);
        return;
      }

      setSlotsLoading(true);
      setSlotsError("");

      try {
        const response = await api.get(`/doctors/${form.doctorId}/availability`, {
          params: {
            date: selectedDate,
            mode: form.mode
          }
        });

        const payload = response.data?.data;
        const nextSlots = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.slots)
            ? payload.slots
            : Array.isArray(payload?.items)
              ? payload.items
              : [];

        setSlots(nextSlots);

        if (
          selectedSlotKey &&
          !nextSlots.some((slot) => `${slot.startTime}|${slot.endTime}` === selectedSlotKey)
        ) {
          setSelectedSlotKey("");
          setForm((prev) => ({ ...prev, startTime: "", endTime: "" }));
        }
      } catch (availabilityError) {
        setSlots([]);
        setSlotsError(getApiErrorMessage(availabilityError, "Unable to load available slots for this date."));
      } finally {
        setSlotsLoading(false);
      }
    };

    loadSlots();
  }, [form.doctorId, form.mode, selectedDate, selectedSlotKey]);

  const onChange = (event) => {
    const { name, value } = event.target;

    if (name === "mode") {
      setSelectedSlotKey("");
      setForm((prev) => ({ ...prev, mode: value, startTime: "", endTime: "" }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const onDateChange = (event) => {
    setSelectedDate(event.target.value);
    setSelectedSlotKey("");
    setForm((prev) => ({ ...prev, startTime: "", endTime: "" }));
  };

  const selectSlot = (slot) => {
    const slotKey = `${slot.startTime}|${slot.endTime}`;
    setSelectedSlotKey(slotKey);
    setForm((prev) => ({
      ...prev,
      startTime: slot.startTime,
      endTime: slot.endTime
    }));
  };

  const submit = async () => {
    if (!form.doctorId) {
      setError("Doctor information is missing. Please return to search and select a doctor again.");
      return;
    }

    if (!form.startTime || !form.endTime) {
      setError("Please select an available slot before continuing.");
      return;
    }

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
    <PortalLayout
      eyebrow="Appointment Service"
      title="Book Appointment"
      description="Confirm your preferred slot and proceed to checkout."
      accent="cyan"
    >
      <PatientPortalNav />

      <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-cyan-300/15 bg-slate-950/45 p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-cyan-200">
            Booking Details
          </p>
          <span className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
            Secure Hold + Checkout
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
              <UserRound size={14} />
              Doctor
            </span>
            <div className="rounded-xl border border-white/15 bg-slate-900/60 px-3 py-2.5">
              <p className="text-sm font-semibold text-white">{doctorLoading ? "Loading doctor..." : doctorProfile.name}</p>
              <p className="mt-1 text-xs text-slate-300">
                {doctorProfile.specialization} • {doctorProfile.hospital}
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-cyan-300">
                {doctorReference} • {doctorProfile.language}
              </p>
            </div>
          </div>

          <label className="space-y-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
              <CalendarClock size={14} />
              Consultation Mode
            </span>
            <select
              name="mode"
              value={form.mode}
              onChange={onChange}
              className="w-full rounded-xl border border-white/15 bg-slate-900/60 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-400/20"
            >
              <option value="TELEMEDICINE">Telemedicine</option>
              <option value="IN_PERSON">In Person</option>
            </select>
            {availableModes.length > 0 && !availableModes.includes(form.mode) ? (
              <p className="text-xs text-amber-300">This doctor does not have slots for the selected mode.</p>
            ) : null}
          </label>

          <label className="space-y-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
              <CalendarDays size={14} />
              Appointment Date
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={onDateChange}
              min={toDateInputValue(Date.now())}
              className="w-full rounded-xl border border-white/15 bg-slate-900/60 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-400/20"
            />
          </label>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
              <Clock3 size={14} />
              Selected Slot
            </span>
            <div className="rounded-xl border border-white/15 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-200">
              {form.startTime && form.endTime
                ? `${formatSlotTime(form.startTime)} - ${formatSlotTime(form.endTime)}`
                : "No slot selected"}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
            <Clock3 size={14} />
            Available Slots
          </p>

          {slotsLoading ? (
            <div className="rounded-xl border border-white/10 bg-slate-900/35 px-3 py-3 text-sm text-slate-300">
              Loading available slots...
            </div>
          ) : slotsError ? (
            <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-3 text-sm text-rose-200">
              {slotsError}
            </div>
          ) : slots.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-slate-900/35 px-3 py-3 text-sm text-slate-300">
              No available slots for this date in {form.mode === "TELEMEDICINE" ? "Telemedicine" : "In Person"} mode. Please change date or mode.
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-3">
              {slots.map((slot) => {
                const slotKey = `${slot.startTime}|${slot.endTime}`;
                const isActive = selectedSlotKey === slotKey;

                return (
                  <button
                    key={slotKey}
                    type="button"
                    onClick={() => selectSlot(slot)}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "border-cyan-300/60 bg-cyan-400/20 text-cyan-100"
                        : "border-white/15 bg-slate-900/50 text-slate-200 hover:border-cyan-300/40 hover:text-cyan-100"
                    }`}
                  >
                    {formatSlotTime(slot.startTime)} - {formatSlotTime(slot.endTime)}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <label className="mt-4 block space-y-2">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
            <FileText size={14} />
            Reason for Consultation
          </span>
          <textarea
            name="reason"
            value={form.reason}
            onChange={onChange}
            rows={4}
            placeholder="Describe your symptoms or reason for consultation"
            className="w-full rounded-xl border border-white/15 bg-slate-900/60 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-400/20"
          />
        </label>

        {error ? (
          <p className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={submit}
            disabled={booking}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {booking ? "Booking..." : "Reserve & Continue"}
          </button>

          <Link
            to="/patient/find-doctor"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-slate-900/40 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/30 hover:text-cyan-200"
          >
            <ArrowLeft size={15} />
            Back to Search
          </Link>
        </div>
      </div>
    </PortalLayout>
  );
};

export default BookAppointment;
