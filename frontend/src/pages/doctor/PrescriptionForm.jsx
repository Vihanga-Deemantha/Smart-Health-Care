import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios.js";
import { fetchDoctorAppointment } from "../../api/doctorApi.js";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";

const emptyMedicine = {
  name: "",
  dose: "",
  frequency: "",
  duration: "",
  notes: ""
};

const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Something went wrong.";

const PrescriptionForm = () => {
  const { appointmentId } = useParams();
  const [medicines, setMedicines] = useState([emptyMedicine]);
  const [patientId, setPatientId] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingPrescription, setLoadingPrescription] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [hasExisting, setHasExisting] = useState(false);

  useEffect(() => {
    const loadAppointment = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetchDoctorAppointment(appointmentId);
        const appointment =
          response.data?.data?.appointment || response.data?.appointment || response.data?.data;
        const nextPatientId =
          appointment?.patientId || appointment?.patient?._id || appointment?.patient?.id;

        if (!nextPatientId) {
          throw new Error("Patient id not found for this appointment.");
        }

        setPatientId(nextPatientId);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    loadAppointment();
  }, [appointmentId]);

  useEffect(() => {
    const loadPrescription = async () => {
      if (!appointmentId) {
        setLoadingPrescription(false);
        return;
      }

      setLoadingPrescription(true);

      try {
        const response = await api.get(`/api/prescriptions/appointment/${appointmentId}`);
        const payload = response.data?.data?.prescription || response.data?.prescription || response.data?.data;

        if (payload) {
          setDiagnosis(payload.diagnosis || "");
          setInstructions(payload.instructions || "");
          setMedicines(
            Array.isArray(payload.medicines) && payload.medicines.length
              ? payload.medicines
              : [emptyMedicine]
          );
          setHasExisting(true);
        }
      } catch (err) {
        if (err?.response?.status !== 404) {
          setError(getErrorMessage(err));
        }
      } finally {
        setLoadingPrescription(false);
      }
    };

    loadPrescription();
  }, [appointmentId]);

  const updateMedicine = (index, key, value) => {
    setMedicines((current) =>
      current.map((medicine, medicineIndex) =>
        medicineIndex === index ? { ...medicine, [key]: value } : medicine
      )
    );
  };

  const addMedicine = () => {
    setMedicines((current) => [...current, { ...emptyMedicine }]);
  };

  const removeMedicine = (index) => {
    setMedicines((current) => current.filter((_, medicineIndex) => medicineIndex !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    const cleaned = medicines
      .map((medicine) => ({
        name: medicine.name.trim(),
        dose: medicine.dose.trim(),
        frequency: medicine.frequency.trim(),
        duration: medicine.duration.trim(),
        notes: medicine.notes.trim()
      }))
      .filter((medicine) => medicine.name);

    const trimmedDiagnosis = diagnosis.trim();
    const trimmedInstructions = instructions.trim();

    if (!trimmedDiagnosis) {
      setError("Diagnosis is required before submitting.");
      setSubmitting(false);
      return;
    }

    if (!trimmedInstructions) {
      setError("Instructions are required before submitting.");
      setSubmitting(false);
      return;
    }

    if (!cleaned.length) {
      setError("Add at least one medicine before submitting.");
      setSubmitting(false);
      return;
    }

    try {
      if (hasExisting) {
        await api.patch(`/api/prescriptions/appointment/${appointmentId}`, {
          diagnosis: trimmedDiagnosis,
          instructions: trimmedInstructions,
          medicines: cleaned
        });

        setSuccess("Prescription updated successfully.");
      } else {
        await api.post("/api/prescriptions", {
          appointmentId,
          patientId,
          diagnosis: trimmedDiagnosis,
          instructions: trimmedInstructions,
          medicines: cleaned
        });

        setHasExisting(true);
        setSuccess("Prescription submitted successfully.");
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-6">
        <h2 className="text-xl font-semibold text-white">
          {hasExisting ? "Edit Prescription" : "Prescription"}
        </h2>
        <p className="text-sm text-slate-400">Appointment ID: {appointmentId}</p>
        {patientId ? (
          <p className="text-xs text-slate-500">Patient ID: {patientId}</p>
        ) : null}
      </div>

      {loading || loadingPrescription ? (
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-6">
          <LoadingSpinner label="Loading appointment..." />
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

      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-6">
        <h3 className="text-sm font-semibold text-white">Clinical Summary</h3>
        <p className="text-xs text-slate-400">Provide the diagnosis and care instructions for the patient.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Diagnosis
            <textarea
              rows={4}
              value={diagnosis}
              onChange={(event) => setDiagnosis(event.target.value)}
              className="rounded-xl border border-slate-800/80 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              placeholder="Primary diagnosis or assessment"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Instructions
            <textarea
              rows={4}
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              className="rounded-xl border border-slate-800/80 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              placeholder="Care instructions, follow-up, lifestyle guidance"
            />
          </label>
        </div>
      </div>

      <div className="space-y-4">
        {medicines.map((medicine, index) => (
          <div
            key={`medicine-${index}`}
            className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Name
                <input
                  type="text"
                  value={medicine.name}
                  onChange={(event) => updateMedicine(index, "name", event.target.value)}
                  className="rounded-xl border border-slate-800/80 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  placeholder="Medicine name"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Dose
                <input
                  type="text"
                  value={medicine.dose}
                  onChange={(event) => updateMedicine(index, "dose", event.target.value)}
                  className="rounded-xl border border-slate-800/80 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  placeholder="500mg"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Frequency
                <input
                  type="text"
                  value={medicine.frequency}
                  onChange={(event) => updateMedicine(index, "frequency", event.target.value)}
                  className="rounded-xl border border-slate-800/80 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  placeholder="Twice daily"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Duration
                <input
                  type="text"
                  value={medicine.duration}
                  onChange={(event) => updateMedicine(index, "duration", event.target.value)}
                  className="rounded-xl border border-slate-800/80 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  placeholder="7 days"
                />
              </label>
            </div>

            <label className="mt-4 flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Notes
              <textarea
                rows={3}
                value={medicine.notes}
                onChange={(event) => updateMedicine(index, "notes", event.target.value)}
                className="rounded-xl border border-slate-800/80 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                placeholder="Additional guidance for patient"
              />
            </label>

            {medicines.length > 1 ? (
              <button
                type="button"
                onClick={() => removeMedicine(index)}
                className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-rose-300"
              >
                Remove medicine
              </button>
            ) : null}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={addMedicine}
          className="rounded-xl border border-slate-700/70 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-[#01696f]/40 hover:text-[#7be0e6]"
        >
          Add medicine
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-[#01696f] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#028a93] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? (
            <LoadingSpinner label="Submitting..." />
          ) : hasExisting ? (
            "Update prescription"
          ) : (
            "Submit prescription"
          )}
        </button>
      </div>
    </form>
  );
};

export default PrescriptionForm;
