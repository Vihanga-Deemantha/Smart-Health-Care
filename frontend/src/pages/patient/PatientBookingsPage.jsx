import { useState, useEffect } from "react";
import { CheckCircle, Star, AlertCircle } from "lucide-react";
import PatientLayout from "../../components/patient/PatientLayout.jsx";
import { fetchPatientAppointments } from "../../api/patientApi.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";

const PatientBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCompletedAppointments();
  }, []);

  const fetchCompletedAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetchPatientAppointments({ status: "COMPLETED", limit: 100 });
      setBookings(response.data?.data?.items || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to fetch completed appointments"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PatientLayout
      eyebrow="Healthcare History"
      title="Completed Bookings"
      description="View your completed appointments and leave reviews."
      accent="cyan"
    >
      {loading && (
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-300">Loading completed bookings...</p>
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

      {!loading && !error && bookings.length === 0 && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-8 text-center">
          <CheckCircle size={32} className="mx-auto mb-3 text-slate-500" />
          <p className="text-slate-300">No completed appointments yet.</p>
          <p className="text-sm text-slate-400">
            Once you complete an appointment, it will appear here.
          </p>
        </div>
      )}

      {!loading && !error && bookings.length > 0 && (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking._id}
              className="rounded-lg border border-white/10 bg-white/5 p-6 transition hover:bg-white/[0.07]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Dr. {booking.doctorId}</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Completed on {new Date(booking.statusTimestamps?.confirmedAt || booking.updatedAt || booking.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-green-400/10 px-3 py-1 text-green-300">
                  <CheckCircle size={16} />
                  <span className="text-sm font-medium">Completed</span>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Duration</p>
                  <p className="mt-1 text-sm text-white">
                    {Math.round((new Date(booking.endTime) - new Date(booking.startTime)) / 60000)} minutes
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Consultation Mode</p>
                  <p className="mt-1 text-sm text-white">{booking.mode}</p>
                </div>
              </div>

              <button className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white">
                <Star size={16} />
                Leave Review
              </button>
            </div>
          ))}
        </div>
      )}
    </PatientLayout>
  );
};

export default PatientBookingsPage;
