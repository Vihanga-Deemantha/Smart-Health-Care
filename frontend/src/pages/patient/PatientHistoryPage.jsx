import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import PortalLayout from "../../components/common/PortalLayout.jsx";
import PatientPortalNav from "../../components/patient/PatientPortalNav.jsx";
import { fetchPatientHistory } from "../../api/patientApi.js";
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

const PatientHistoryPage = () => {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);

      try {
        const response = await fetchPatientHistory({ page: 1, limit: 50 });
        const items = response.data?.data?.items || [];
        const sorted = [...items].sort(
          (a, b) => new Date(b.startTime || b.createdAt).getTime() - new Date(a.startTime || a.createdAt).getTime()
        );

        setAppointments(sorted);
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Unable to load appointment history."));
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  return (
    <PortalLayout
      eyebrow="Patient Workspace"
      title="Appointment History"
      description="Review your previous consultations and appointment timeline."
      accent="cyan"
    >
      <PatientPortalNav />

      <div className="rounded-2xl border border-slate-700/70 bg-slate-950/45 p-5">
        {loading ? (
          <p className="text-sm text-slate-300">Loading history...</p>
        ) : appointments.length === 0 ? (
          <p className="text-sm text-slate-300">No historical appointments found.</p>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div key={appointment._id} className="relative rounded-xl border border-slate-700/70 bg-slate-950/70 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">Doctor: {appointment.doctorId || "N/A"}</p>
                  <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[11px] font-semibold text-cyan-200">
                    {appointment.status || "BOOKED"}
                  </span>
                </div>
                <p className="text-xs text-slate-300">Date: {formatDate(appointment.startTime)}</p>
                <p className="mt-1 text-xs text-slate-300">Mode: {appointment.mode || "N/A"}</p>
                <p className="mt-1 text-xs text-slate-300">Reason: {appointment.reason || "Not provided"}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default PatientHistoryPage;
