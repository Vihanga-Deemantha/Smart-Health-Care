import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import PortalLayout from "../../components/common/PortalLayout.jsx";
import PatientPortalNav from "../../components/patient/PatientPortalNav.jsx";
import { fetchPatientPrescriptions } from "../../api/patientApi.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  });
};

const getMedicineSummary = (medicine) => {
  const parts = [medicine?.name, medicine?.dose, medicine?.frequency, medicine?.duration]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean);

  return parts.join(" • ") || "Medicine";
};

const PatientPrescriptionsPage = () => {
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(() => {
    const loadPrescriptions = async () => {
      setLoading(true);

      try {
        const response = await fetchPatientPrescriptions({ limit: 50 });
        const items = response.data?.data?.items || [];
        const sorted = [...items].sort(
          (a, b) => new Date(b.issuedAt || b.createdAt).getTime() - new Date(a.issuedAt || a.createdAt).getTime()
        );
        setPrescriptions(sorted);
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Unable to load prescriptions."));
      } finally {
        setLoading(false);
      }
    };

    loadPrescriptions();
  }, []);

  return (
    <PortalLayout
      eyebrow="Patient Workspace"
      title="Prescriptions"
      description="Review diagnosis details, instructions, and issued medicines from your doctor."
      accent="cyan"
    >
      <PatientPortalNav />

      <div className="rounded-2xl border border-slate-700/70 bg-slate-950/45 p-5">
        {loading ? (
          <p className="text-sm text-slate-300">Loading prescriptions...</p>
        ) : prescriptions.length === 0 ? (
          <p className="text-sm text-slate-300">No prescriptions available yet.</p>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((prescription, index) => {
              const medicines = Array.isArray(prescription.medicines)
                ? prescription.medicines.filter((medicine) => medicine?.name)
                : [];

              return (
                <div
                  key={prescription._id || prescription.appointmentId || index}
                  className="rounded-xl border border-slate-700/70 bg-slate-950/70 p-4"
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">
                      {prescription.diagnosis || "Prescription"}
                    </p>
                    <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[11px] font-semibold text-cyan-200">
                      {formatDate(prescription.issuedAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Doctor: {prescription.doctorName || prescription.doctorId || "N/A"}
                  </p>
                  {prescription.instructions ? (
                    <p className="mt-2 text-xs text-slate-400">Instructions: {prescription.instructions}</p>
                  ) : null}

                  <div className="mt-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Medicines
                    </p>
                    {medicines.length === 0 ? (
                      <p className="mt-2 text-xs text-slate-400">No medicines listed.</p>
                    ) : (
                      <ul className="mt-2 space-y-2 text-xs text-slate-200">
                        {medicines.map((medicine, medicineIndex) => (
                          <li key={`${prescription._id || index}-med-${medicineIndex}`}>
                            <p className="font-semibold text-slate-100">
                              {getMedicineSummary(medicine)}
                            </p>
                            {medicine?.notes ? (
                              <p className="mt-0.5 text-[11px] text-slate-400">Notes: {medicine.notes}</p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default PatientPrescriptionsPage;
