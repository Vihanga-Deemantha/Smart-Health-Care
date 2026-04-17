import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  CalendarClock,
  ChevronRight,
  FileText,
  MessageSquareHeart,
  PlusCircle,
  Search,
  Stethoscope,
  TicketCheck
} from "lucide-react";
import toast from "react-hot-toast";
import PortalLayout from "../../components/common/PortalLayout.jsx";
import PatientPortalNav from "../../components/patient/PatientPortalNav.jsx";
import {
  fetchPatientAppointments,
  fetchPatientPrescriptions,
  fetchPatientReports
} from "../../api/patientApi.js";
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

const PatientDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [reportsCount, setReportsCount] = useState(0);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);

      try {
        const [appointmentsResponse, prescriptionsResponse, reportsResponse] = await Promise.all([
          fetchPatientAppointments({ from: new Date().toISOString(), limit: 5 }),
          fetchPatientPrescriptions({ limit: 5 }),
          fetchPatientReports()
        ]);

        setUpcomingAppointments(appointmentsResponse.data?.data?.items || []);
        setPrescriptions(prescriptionsResponse.data?.data?.items || []);
        setReportsCount((reportsResponse.data?.data || []).length);
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Unable to load dashboard data."));
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const stats = useMemo(
    () => [
      {
        label: "Upcoming Appointments",
        value: upcomingAppointments.length,
        icon: CalendarClock,
        color: "#0ea5e9"
      },
      {
        label: "Recent Prescriptions",
        value: prescriptions.length,
        icon: Stethoscope,
        color: "#22c55e"
      },
      {
        label: "Uploaded Reports",
        value: reportsCount,
        icon: FileText,
        color: "#f59e0b"
      }
    ],
    [upcomingAppointments.length, prescriptions.length, reportsCount]
  );

  const quickActions = useMemo(
    () => [
      {
        icon: Search,
        label: "Book Appointment",
        desc: "Find doctors and reserve a slot",
        to: "/patient/find-doctor",
        accent: "#56CCF2"
      },
      {
        icon: CalendarClock,
        label: "My Appointments",
        desc: "View and manage active visits",
        to: "/patient/appointments",
        accent: "#2F80ED"
      },
      {
        icon: TicketCheck,
        label: "Completed Bookings",
        desc: "Review finished consultations",
        to: "/patient/bookings",
        accent: "#27AE60"
      }
    ],
    []
  );

  return (
    <PortalLayout
      eyebrow="Patient Workspace"
      title="Dashboard"
      description="Track your care journey, monitor records, and start AI-assisted triage from one place."
      accent="cyan"
    >
      <div className="text-left">
        <PatientPortalNav />

        <div className="mb-6 rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-200">
                Appointment Services
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Book a visit, review active appointments, or open the appointment service directly.
              </p>
            </div>
            <Link
              to="/patient/find-doctor"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:scale-[1.01]"
            >
              <PlusCircle size={16} />
              Open Appointment Service
            </Link>
          </div>
        </div>

        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Quick Access
            </p>
            <Link to="/patient/find-doctor" className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-300 hover:text-cyan-200">
              Browse doctors <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {quickActions.map(({ icon, label, desc, to, accent }, index) => {
              const IconComponent = icon;

              return (
                <Link
                  key={label}
                  to={to}
                  className="group flex min-h-[156px] flex-col justify-between rounded-2xl p-4 text-left transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: `linear-gradient(180deg, ${accent}14, rgba(2, 6, 23, 0.55))`,
                    border: `1px solid ${accent}26`,
                    boxShadow: index === 1 ? `0 16px 32px ${accent}16` : "none"
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-300">
                        {label}
                      </p>
                      <p className="mt-2 max-w-[16rem] text-sm leading-snug text-slate-200">
                        {desc}
                      </p>
                    </div>
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                      style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
                    >
                      <IconComponent size={18} style={{ color: accent }} />
                    </div>
                  </div>

                  <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-slate-400 transition group-hover:text-slate-200">
                    Open <ChevronRight size={14} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map(({ label, value, icon, color }) => {
            const IconComponent = icon;

            return (
              <div
                key={label}
                className="flex min-h-[108px] flex-col justify-between rounded-2xl p-4"
                style={{
                  background: "rgba(15, 23, 42, 0.35)",
                  border: "1px solid rgba(148, 163, 184, 0.2)"
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-300">
                    {label}
                  </span>
                  <IconComponent size={16} style={{ color }} />
                </div>
                <p className="text-3xl font-black leading-none text-white">{value}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div
            className="rounded-2xl p-5"
            style={{
              background: "rgba(15, 23, 42, 0.35)",
              border: "1px solid rgba(148, 163, 184, 0.2)"
            }}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-white">Upcoming Appointments</h3>
              <Link
                to="/history"
                className="inline-flex items-center gap-1 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition hover:border-cyan-300/35 hover:bg-cyan-400/10 hover:text-cyan-200"
              >
                View history <ChevronRight size={13} />
              </Link>
            </div>

            {loading ? (
              <p className="text-sm text-slate-300">Loading appointments...</p>
            ) : upcomingAppointments.length === 0 ? (
              <p className="text-sm text-slate-300">No upcoming appointments found.</p>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map((item) => (
                  <div
                    key={item._id}
                    className="rounded-xl p-3"
                    style={{
                      background: "rgba(2, 6, 23, 0.55)",
                      border: "1px solid rgba(148, 163, 184, 0.18)"
                    }}
                  >
                    <p className="text-xs font-semibold text-white">Doctor: {item.doctorId || "Not assigned"}</p>
                    <p className="mt-1 text-xs text-slate-300">{formatDate(item.startTime)}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-wide text-cyan-200">
                      {item.status || "BOOKED"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div
              className="rounded-2xl p-5"
              style={{
                background: "rgba(15, 23, 42, 0.35)",
                border: "1px solid rgba(148, 163, 184, 0.2)"
              }}
            >
              <h3 className="mb-3 text-sm font-bold text-white">Recent Prescriptions</h3>
              {loading ? (
                <p className="text-sm text-slate-300">Loading prescriptions...</p>
              ) : prescriptions.length === 0 ? (
                <p className="text-sm text-slate-300">No recent prescriptions available.</p>
              ) : (
                <div className="space-y-2">
                  {prescriptions.map((item, index) => (
                    <div
                      key={item.appointmentId || index}
                      className="rounded-xl p-3 text-xs"
                      style={{
                        background: "rgba(2, 6, 23, 0.55)",
                        border: "1px solid rgba(148, 163, 184, 0.18)"
                      }}
                    >
                      <p className="font-semibold text-white">
                        {item.diagnosis || item.prescription?.title || "Prescription"}
                      </p>
                      <p className="mt-1 text-slate-300">
                        Doctor: {item.doctorName || item.doctorId || "N/A"}
                      </p>
                      <p className="mt-1 text-slate-400">{formatDate(item.issuedAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link
              to="/ai-chat"
              className="group flex items-center justify-between gap-4 rounded-2xl p-5 text-left transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, rgba(14,165,233,0.2), rgba(34,211,238,0.2))",
                border: "1px solid rgba(34,211,238,0.45)"
              }}
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-cyan-200">AI Triage</p>
                <p className="mt-1 text-sm font-semibold text-white">Chat with AI assistant</p>
                <p className="mt-1 text-xs text-slate-200">
                  Get preliminary guidance and a suggested specialty.
                </p>
              </div>
              <MessageSquareHeart
                size={24}
                className="text-cyan-200 transition-transform group-hover:scale-110"
              />
            </Link>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-700/60 bg-slate-950/40 p-4">
          <div className="flex items-start gap-3">
            <Activity size={18} className="mt-0.5 text-emerald-300" />
            <p className="text-xs leading-relaxed text-slate-300">
              AI suggestions are preliminary and not a diagnosis. Always consult a licensed doctor for
              clinical decisions.
            </p>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default PatientDashboardPage;
