import { useState, useEffect } from "react";
import { Calendar, MapPin, User, AlertCircle } from "lucide-react";
import PatientLayout from "../../components/patient/PatientLayout.jsx";
import api from "../../services/axios.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";

const PatientAppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get("/appointments");
      setAppointments(response.data?.data?.items || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to fetch appointments"));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      BOOKED: "bg-blue-400/10 text-blue-300",
      CONFIRMED: "bg-green-400/10 text-green-300",
      COMPLETED: "bg-emerald-400/10 text-emerald-300",
      CANCELLED: "bg-red-400/10 text-red-300",
      NO_SHOW: "bg-orange-400/10 text-orange-300"
    };
    return colors[status] || "bg-slate-400/10 text-slate-300";
  };

  return (
    <PatientLayout
      eyebrow="Healthcare Management"
      title="My Appointments"
      description="View and manage your upcoming and past appointments."
      accent="cyan"
    >
      {loading && (
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-300">Loading appointments...</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-400/30 bg-red-400/5 p-4 text-red-300">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && appointments.length === 0 && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-8 text-center">
          <Calendar size={32} className="mx-auto mb-3 text-slate-500" />
          <p className="text-slate-300">No appointments yet.</p>
          <p className="text-sm text-slate-400">
            <a href="/patient/find-doctor" className="text-cyan-300 hover:text-cyan-200">
              Start by searching for a doctor
            </a>
          </p>
        </div>
      )}

      {!loading && !error && appointments.length > 0 && (
        <div className="space-y-4">
          {appointments.map((apt) => (
            <div
              key={apt._id}
              className="rounded-lg border border-white/10 bg-white/5 p-6 transition hover:bg-white/[0.07]"
            >
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Doctor</p>
                  <div className="mt-2 flex items-center gap-2">
                    <User size={16} className="text-cyan-300" />
                    <p className="text-white">{apt.doctorId || "Doctor"}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Date & Time</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Calendar size={16} className="text-cyan-300" />
                    <p className="text-white">
                      {new Date(apt.startTime).toLocaleDateString()}{" "}
                      {new Date(apt.startTime).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Mode</p>
                  <div className="mt-2 flex items-center gap-2">
                    <MapPin size={16} className="text-cyan-300" />
                    <p className="text-white">{apt.mode || "N/A"}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(apt.status)}`}>
                  {apt.status}
                </span>
                {apt.telemedicine?.meetingLink && (
                  <a
                    href={apt.telemedicine.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-cyan-300 hover:text-cyan-200"
                  >
                    Join Meeting →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </PatientLayout>
  );
};

export default PatientAppointmentsPage;
