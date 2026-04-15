import { useState } from "react";
import { Link } from "react-router-dom";
import { Wrench, RefreshCw } from "lucide-react";
import PatientLayout from "../../components/patient/PatientLayout.jsx";
import api from "../../services/axios.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";
import { useAuth } from "../../hooks/useAuth.js";

const pretty = (data) => JSON.stringify(data, null, 2);

const PatientServiceToolsPage = () => {
  const { user } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);

  const [appointmentActionForm, setAppointmentActionForm] = useState({
    appointmentId: "",
    cancelReason: "",
    newStartTime: "",
    newEndTime: ""
  });

  const [waitlistForm, setWaitlistForm] = useState({
    doctorId: "",
    mode: "TELEMEDICINE",
    preferredFrom: "",
    preferredTo: "",
    priority: 0
  });

  const [feedbackForm, setFeedbackForm] = useState({
    appointmentId: "",
    rating: 5,
    review: "",
    isAnonymous: false
  });

  const [notificationPrefs, setNotificationPrefs] = useState({
    smsEnabled: true,
    whatsappEnabled: true,
    emailEnabled: true,
    timezone: "UTC",
    locale: "en"
  });

  const [resourceQuery, setResourceQuery] = useState({
    category: "",
    city: "",
    country: ""
  });
  const [resources, setResources] = useState([]);

  const [paymentForm, setPaymentForm] = useState({
    appointmentId: "",
    doctorId: "",
    amount: 50,
    currency: "USD",
    paymentId: "",
    failureReason: ""
  });

  const [result, setResult] = useState({ type: "", message: "", payload: null });

  const showSuccess = (message, payload = null) => setResult({ type: "success", message, payload });
  const showError = (error, fallback) =>
    setResult({
      type: "error",
      message: getApiErrorMessage(error, fallback),
      payload: error?.response?.data || null
    });

  const loadAppointments = async () => {
    try {
      setAppointmentsLoading(true);
      const response = await api.get("/appointments", {
        params: { page: 1, limit: 20 }
      });
      const items = response.data?.data?.items || [];
      setAppointments(items);
      showSuccess("Appointments loaded.", { count: items.length });
    } catch (error) {
      showError(error, "Failed to load appointments.");
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const cancelAppointment = async () => {
    try {
      const response = await api.patch(
        `/appointments/${appointmentActionForm.appointmentId}/cancel`,
        {
          reason: appointmentActionForm.cancelReason || "Cancelled by patient"
        }
      );
      showSuccess("Appointment cancelled.", response.data?.data);
      await loadAppointments();
    } catch (error) {
      showError(error, "Failed to cancel appointment.");
    }
  };

  const rescheduleAppointment = async () => {
    try {
      const response = await api.patch(
        `/appointments/${appointmentActionForm.appointmentId}/reschedule`,
        {
          newStartTime: appointmentActionForm.newStartTime,
          newEndTime: appointmentActionForm.newEndTime
        }
      );
      showSuccess("Appointment rescheduled.", response.data?.data);
      await loadAppointments();
    } catch (error) {
      showError(error, "Failed to reschedule appointment.");
    }
  };

  const confirmAttendance = async () => {
    try {
      const response = await api.patch(
        `/appointments/${appointmentActionForm.appointmentId}/confirm-attendance`
      );
      showSuccess("Attendance confirmed.", response.data?.data);
      await loadAppointments();
    } catch (error) {
      showError(error, "Failed to confirm attendance.");
    }
  };

  const joinWaitlist = async () => {
    try {
      const response = await api.post("/waitlist", {
        ...waitlistForm,
        priority: Number(waitlistForm.priority)
      });
      showSuccess("Joined waitlist.", response.data?.data);
    } catch (error) {
      showError(error, "Failed to join waitlist.");
    }
  };

  const submitFeedback = async () => {
    try {
      const response = await api.post("/feedback", {
        ...feedbackForm,
        rating: Number(feedbackForm.rating)
      });
      showSuccess("Feedback submitted.", response.data?.data);
    } catch (error) {
      showError(error, "Failed to submit feedback.");
    }
  };

  const loadNotificationPrefs = async () => {
    try {
      const response = await api.get("/notifications/preferences");
      setNotificationPrefs(response.data?.data || notificationPrefs);
      showSuccess("Notification preferences loaded.", response.data?.data);
    } catch (error) {
      showError(error, "Failed to load notification preferences.");
    }
  };

  const updateNotificationPrefs = async () => {
    try {
      const response = await api.patch("/notifications/preferences", notificationPrefs);
      showSuccess("Notification preferences updated.", response.data?.data);
    } catch (error) {
      showError(error, "Failed to update notification preferences.");
    }
  };

  const searchResources = async () => {
    try {
      const response = await api.get("/emergency-resources", {
        params: resourceQuery
      });
      const items = response.data?.data || [];
      setResources(items);
      showSuccess("Emergency resources loaded.", { count: items.length });
    } catch (error) {
      showError(error, "Failed to load emergency resources.");
    }
  };

  const createCheckout = async () => {
    try {
      const response = await api.post("/payments/checkout", {
        appointmentId: paymentForm.appointmentId,
        patientId: user?.userId,
        doctorId: paymentForm.doctorId,
        amount: Number(paymentForm.amount),
        currency: paymentForm.currency
      });
      const payment = response.data?.data;
      setPaymentForm((prev) => ({ ...prev, paymentId: payment?._id || prev.paymentId }));
      showSuccess("Checkout created.", payment);
    } catch (error) {
      showError(error, "Failed to create checkout.");
    }
  };

  const capturePayment = async () => {
    try {
      const response = await api.patch(`/payments/${paymentForm.paymentId}/capture`);
      showSuccess("Payment captured.", response.data?.data);
    } catch (error) {
      showError(error, "Failed to capture payment.");
    }
  };

  const failPayment = async () => {
    try {
      const response = await api.patch(`/payments/${paymentForm.paymentId}/fail`, {
        reason: paymentForm.failureReason || "Marked failed by user"
      });
      showSuccess("Payment marked failed.", response.data?.data);
    } catch (error) {
      showError(error, "Failed to mark payment failed.");
    }
  };

  const getPaymentByAppointment = async () => {
    try {
      const response = await api.get(`/payments/appointment/${paymentForm.appointmentId}`);
      showSuccess("Payment fetched by appointment.", response.data?.data);
    } catch (error) {
      showError(error, "Failed to fetch payment by appointment.");
    }
  };

  return (
    <PatientLayout
      eyebrow="Standalone Backend Features"
      title="Service Tools"
      description="Use these tools to call appointment and payment features that do not require direct access to other services."
      accent="cyan"
    >
      <div className="space-y-6">
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-sm text-cyan-100">
          <div className="flex items-center gap-2 font-semibold">
            <Wrench size={16} />
            Quick Access
          </div>
          <p className="mt-2">You can still use guided flow pages for booking and checkout:</p>
          <div className="mt-2 flex flex-wrap gap-4">
            <Link to="/patient/find-doctor" className="text-cyan-300 underline">Find Doctor</Link>
            <Link to="/patient/appointments" className="text-cyan-300 underline">My Appointments</Link>
            <Link to="/patient/bookings" className="text-cyan-300 underline">Completed Bookings</Link>
          </div>
        </div>

        <section className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">Appointments: Load + Actions</h3>
            <button
              onClick={loadAppointments}
              disabled={appointmentsLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              <RefreshCw size={14} />
              {appointmentsLoading ? "Loading..." : "Refresh"}
            </button>
          </div>

          <div className="mb-3 grid gap-2 md:grid-cols-2">
            <input
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm"
              placeholder="Appointment ID"
              value={appointmentActionForm.appointmentId}
              onChange={(e) => setAppointmentActionForm((p) => ({ ...p, appointmentId: e.target.value }))}
            />
            <input
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm"
              placeholder="Cancel reason"
              value={appointmentActionForm.cancelReason}
              onChange={(e) => setAppointmentActionForm((p) => ({ ...p, cancelReason: e.target.value }))}
            />
            <input
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm"
              placeholder="New start time (ISO)"
              value={appointmentActionForm.newStartTime}
              onChange={(e) => setAppointmentActionForm((p) => ({ ...p, newStartTime: e.target.value }))}
            />
            <input
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm"
              placeholder="New end time (ISO)"
              value={appointmentActionForm.newEndTime}
              onChange={(e) => setAppointmentActionForm((p) => ({ ...p, newEndTime: e.target.value }))}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={cancelAppointment} className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-200">Cancel</button>
            <button onClick={rescheduleAppointment} className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-200">Reschedule</button>
            <button onClick={confirmAttendance} className="rounded-lg bg-green-500/20 px-3 py-2 text-sm text-green-200">Confirm Attendance</button>
          </div>

          {appointments.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-400">
                  <tr>
                    <th className="pb-2">ID</th>
                    <th className="pb-2">Doctor</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Start</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((a) => (
                    <tr key={a._id} className="border-t border-white/5">
                      <td className="py-2 pr-2">{a._id}</td>
                      <td className="py-2 pr-2">{a.doctorId}</td>
                      <td className="py-2 pr-2">{a.status}</td>
                      <td className="py-2">{new Date(a.startTime).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="mb-3 text-base font-semibold text-white">Waitlist</h3>
            <div className="space-y-2">
              <input className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm" placeholder="Doctor ID" value={waitlistForm.doctorId} onChange={(e) => setWaitlistForm((p) => ({ ...p, doctorId: e.target.value }))} />
              <select className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm" value={waitlistForm.mode} onChange={(e) => setWaitlistForm((p) => ({ ...p, mode: e.target.value }))}>
                <option value="TELEMEDICINE">TELEMEDICINE</option>
                <option value="IN_PERSON">IN_PERSON</option>
              </select>
              <input className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm" placeholder="Preferred from (ISO)" value={waitlistForm.preferredFrom} onChange={(e) => setWaitlistForm((p) => ({ ...p, preferredFrom: e.target.value }))} />
              <input className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm" placeholder="Preferred to (ISO)" value={waitlistForm.preferredTo} onChange={(e) => setWaitlistForm((p) => ({ ...p, preferredTo: e.target.value }))} />
              <input type="number" min="0" max="10" className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm" placeholder="Priority" value={waitlistForm.priority} onChange={(e) => setWaitlistForm((p) => ({ ...p, priority: e.target.value }))} />
            </div>
            <button onClick={joinWaitlist} className="mt-3 rounded-lg bg-cyan-500/20 px-3 py-2 text-sm text-cyan-100">Join Waitlist</button>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="mb-3 text-base font-semibold text-white">Feedback</h3>
            <div className="space-y-2">
              <input className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm" placeholder="Appointment ID" value={feedbackForm.appointmentId} onChange={(e) => setFeedbackForm((p) => ({ ...p, appointmentId: e.target.value }))} />
              <input type="number" min="1" max="5" className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm" placeholder="Rating (1-5)" value={feedbackForm.rating} onChange={(e) => setFeedbackForm((p) => ({ ...p, rating: e.target.value }))} />
              <textarea className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm" placeholder="Review" value={feedbackForm.review} onChange={(e) => setFeedbackForm((p) => ({ ...p, review: e.target.value }))} />
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={feedbackForm.isAnonymous} onChange={(e) => setFeedbackForm((p) => ({ ...p, isAnonymous: e.target.checked }))} />
                Anonymous
              </label>
            </div>
            <button onClick={submitFeedback} className="mt-3 rounded-lg bg-cyan-500/20 px-3 py-2 text-sm text-cyan-100">Submit Feedback</button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="mb-3 text-base font-semibold text-white">Notification Preferences</h3>
            <div className="grid gap-2 text-sm text-slate-200">
              <label className="flex items-center gap-2"><input type="checkbox" checked={notificationPrefs.smsEnabled} onChange={(e) => setNotificationPrefs((p) => ({ ...p, smsEnabled: e.target.checked }))} /> SMS</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={notificationPrefs.whatsappEnabled} onChange={(e) => setNotificationPrefs((p) => ({ ...p, whatsappEnabled: e.target.checked }))} /> WhatsApp</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={notificationPrefs.emailEnabled} onChange={(e) => setNotificationPrefs((p) => ({ ...p, emailEnabled: e.target.checked }))} /> Email</label>
              <input className="rounded-lg bg-slate-900 px-3 py-2 text-sm" placeholder="Timezone" value={notificationPrefs.timezone} onChange={(e) => setNotificationPrefs((p) => ({ ...p, timezone: e.target.value }))} />
              <input className="rounded-lg bg-slate-900 px-3 py-2 text-sm" placeholder="Locale" value={notificationPrefs.locale} onChange={(e) => setNotificationPrefs((p) => ({ ...p, locale: e.target.value }))} />
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={loadNotificationPrefs} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-200">Load</button>
              <button onClick={updateNotificationPrefs} className="rounded-lg bg-cyan-500/20 px-3 py-2 text-sm text-cyan-100">Update</button>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="mb-3 text-base font-semibold text-white">Emergency Resources</h3>
            <div className="grid gap-2">
              <input className="rounded-lg bg-slate-900 px-3 py-2 text-sm" placeholder="Category (HOSPITAL/AMBULANCE/HELPLINE/POLICE/FIRE)" value={resourceQuery.category} onChange={(e) => setResourceQuery((p) => ({ ...p, category: e.target.value }))} />
              <input className="rounded-lg bg-slate-900 px-3 py-2 text-sm" placeholder="City" value={resourceQuery.city} onChange={(e) => setResourceQuery((p) => ({ ...p, city: e.target.value }))} />
              <input className="rounded-lg bg-slate-900 px-3 py-2 text-sm" placeholder="Country" value={resourceQuery.country} onChange={(e) => setResourceQuery((p) => ({ ...p, country: e.target.value }))} />
            </div>
            <button onClick={searchResources} className="mt-3 rounded-lg bg-cyan-500/20 px-3 py-2 text-sm text-cyan-100">Search</button>
            {resources.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                {resources.map((r) => (
                  <li key={r._id} className="rounded bg-slate-900/60 p-2">{r.name} · {r.phone}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="mb-3 text-base font-semibold text-white">Payments (Standalone Endpoints)</h3>
          <div className="grid gap-2 md:grid-cols-3">
            <input className="rounded-lg bg-slate-900 px-3 py-2 text-sm" placeholder="Appointment ID" value={paymentForm.appointmentId} onChange={(e) => setPaymentForm((p) => ({ ...p, appointmentId: e.target.value }))} />
            <input className="rounded-lg bg-slate-900 px-3 py-2 text-sm" placeholder="Doctor ID" value={paymentForm.doctorId} onChange={(e) => setPaymentForm((p) => ({ ...p, doctorId: e.target.value }))} />
            <input type="number" className="rounded-lg bg-slate-900 px-3 py-2 text-sm" placeholder="Amount" value={paymentForm.amount} onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))} />
            <input className="rounded-lg bg-slate-900 px-3 py-2 text-sm" placeholder="Currency" value={paymentForm.currency} onChange={(e) => setPaymentForm((p) => ({ ...p, currency: e.target.value }))} />
            <input className="rounded-lg bg-slate-900 px-3 py-2 text-sm" placeholder="Payment ID" value={paymentForm.paymentId} onChange={(e) => setPaymentForm((p) => ({ ...p, paymentId: e.target.value }))} />
            <input className="rounded-lg bg-slate-900 px-3 py-2 text-sm" placeholder="Failure reason" value={paymentForm.failureReason} onChange={(e) => setPaymentForm((p) => ({ ...p, failureReason: e.target.value }))} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={createCheckout} className="rounded-lg bg-cyan-500/20 px-3 py-2 text-sm text-cyan-100">Create Checkout</button>
            <button onClick={capturePayment} className="rounded-lg bg-green-500/20 px-3 py-2 text-sm text-green-100">Capture Payment</button>
            <button onClick={failPayment} className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-100">Fail Payment</button>
            <button onClick={getPaymentByAppointment} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-100">Get By Appointment</button>
          </div>
        </section>

        {result.message ? (
          <section className={`rounded-xl border p-4 ${result.type === "error" ? "border-red-400/30 bg-red-400/5" : "border-emerald-400/30 bg-emerald-400/5"}`}>
            <p className={`font-medium ${result.type === "error" ? "text-red-300" : "text-emerald-300"}`}>{result.message}</p>
            {result.payload ? (
              <pre className="mt-2 overflow-auto rounded bg-slate-900/70 p-3 text-xs text-slate-200">{pretty(result.payload)}</pre>
            ) : null}
          </section>
        ) : null}
      </div>
    </PatientLayout>
  );
};

export default PatientServiceToolsPage;
