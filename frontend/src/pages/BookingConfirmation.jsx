import { Link, useSearchParams } from "react-router-dom";
import { BadgeCheck, CalendarClock, CreditCard, Home, Search } from "lucide-react";
import PortalLayout from "../components/common/PortalLayout.jsx";
import PatientPortalNav from "../components/patient/PatientPortalNav.jsx";

const BookingConfirmation = () => {
  const [params] = useSearchParams();
  const appointmentId = params.get("appointmentId");
  const paymentId = params.get("paymentId");
  const checkoutSessionId = params.get("session_id");

  return (
    <PortalLayout
      eyebrow="Payment Completed"
      title="Booking Confirmed"
      description="Your appointment has been booked successfully and your payment has been recorded."
      accent="cyan"
    >
      <PatientPortalNav />

      <div className="mx-auto mt-6 grid max-w-5xl gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-cyan-300/15 bg-slate-950/45 p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
              <BadgeCheck size={14} />
              Payment Success
            </span>
            <span className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
              Confirmation Locked
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/15 bg-slate-900/60 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Appointment ID
              </p>
              <p className="mt-2 break-all text-sm font-semibold text-white">{appointmentId || "Not available"}</p>
            </div>

            <div className="rounded-xl border border-white/15 bg-slate-900/60 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Payment ID
              </p>
              <p className="mt-2 break-all text-sm font-semibold text-white">{paymentId || "Not available"}</p>
            </div>
          </div>

          {checkoutSessionId ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-slate-900/45 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Stripe Session
              </p>
              <p className="mt-2 break-all text-xs font-medium text-slate-200">{checkoutSessionId}</p>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/patient/find-doctor"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:scale-[1.01]"
            >
              <Search size={15} />
              Book Another Appointment
            </Link>

            <Link
              to="/patient/appointments"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-slate-900/40 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/30 hover:text-cyan-200"
            >
              <CalendarClock size={15} />
              View My Appointments
            </Link>
          </div>
        </section>

        <aside className="rounded-2xl border border-white/10 bg-slate-950/35 p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Next Steps</p>

          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <p className="inline-flex items-start gap-2">
              <CreditCard size={15} className="mt-0.5 text-cyan-300" />
              Your payment is captured and stored for reconciliation.
            </p>
            <p className="inline-flex items-start gap-2">
              <BadgeCheck size={15} className="mt-0.5 text-emerald-300" />
              Appointment state will remain confirmed for your upcoming visit.
            </p>
            <p className="inline-flex items-start gap-2">
              <CalendarClock size={15} className="mt-0.5 text-sky-300" />
              Check appointment details and reminders from your dashboard.
            </p>
          </div>

          <Link
            to="/dashboard"
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-slate-900/40 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/30 hover:text-cyan-200"
          >
            <Home size={15} />
            Back to Dashboard
          </Link>
        </aside>
      </div>
    </PortalLayout>
  );
};

export default BookingConfirmation;
