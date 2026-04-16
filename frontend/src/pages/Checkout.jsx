import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, BadgeDollarSign, CreditCard, ShieldCheck } from "lucide-react";
import PortalLayout from "../components/common/PortalLayout.jsx";
import PatientPortalNav from "../components/patient/PatientPortalNav.jsx";
import api from "../services/axios.js";
import { getApiErrorMessage } from "../utils/getApiErrorMessage.js";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(Number(value || 0));

const FIXED_APPOINTMENT_AMOUNT = 50;

const toFriendlyReference = (prefix, value) => {
  if (!value) {
    return "Not available";
  }

  const normalized = String(value).trim();
  const compact = normalized.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const shortCode = (compact.slice(-6) || "000000").padStart(6, "0");

  return `${prefix}-${shortCode}`;
};

const Checkout = () => {
  const [params] = useSearchParams();
  const appointmentId = params.get("appointmentId");
  const doctorId = params.get("doctorId");

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const amount = FIXED_APPOINTMENT_AMOUNT;

  const appointmentReference = useMemo(
    () => toFriendlyReference("APT", appointmentId),
    [appointmentId]
  );
  const doctorReference = useMemo(() => toFriendlyReference("DR", doctorId), [doctorId]);

  const canPay = useMemo(() => {
    return Boolean(appointmentId && doctorId);
  }, [appointmentId, doctorId]);

  const pay = async () => {
    setProcessing(true);
    setError("");
    try {
      const checkoutResponse = await api.post("/payments/checkout", {
        appointmentId,
        doctorId,
        amount: FIXED_APPOINTMENT_AMOUNT,
        currency: "USD"
      });

      const payment = checkoutResponse.data?.data;

      if (!payment?._id || !payment?.checkoutUrl) {
        throw new Error("Checkout failed");
      }

      window.location.assign(payment.checkoutUrl);
    } catch (error) {
      setError(getApiErrorMessage(error, "Payment failed"));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <PortalLayout
      eyebrow="Payment Service"
      title="Checkout"
      description="Complete payment securely to confirm your appointment."
      accent="cyan"
    >
      <PatientPortalNav />

      <div className="mx-auto mt-6 grid max-w-5xl gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-cyan-300/15 bg-slate-950/45 p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-cyan-200">
              Payment Details
            </p>
            <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
              <ShieldCheck size={14} />
              Protected Transaction
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/15 bg-slate-900/60 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Appointment ID
              </p>
              <p className="mt-2 text-sm font-semibold text-white" title={appointmentId || ""}>
                {appointmentReference}
              </p>
            </div>

            <div className="rounded-xl border border-white/15 bg-slate-900/60 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Doctor Reference
              </p>
              <p className="mt-2 text-sm font-semibold text-white" title={doctorId || ""}>
                {doctorReference}
              </p>
            </div>
          </div>

          <label className="mt-4 block space-y-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
              <BadgeDollarSign size={14} />
              Amount (USD)
            </span>
            <div className="flex w-full items-center justify-between rounded-xl border border-white/15 bg-slate-900/60 px-3 py-2.5 text-sm text-white">
              <span className="font-semibold text-white">{formatCurrency(FIXED_APPOINTMENT_AMOUNT)}</span>
              <span className="text-xs font-medium text-cyan-200">Fixed consultation fee</span>
            </div>
          </label>

          {error ? (
            <div className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={pay}
              disabled={processing || !canPay}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <CreditCard size={15} />
              {processing ? "Redirecting to Stripe..." : "Pay with Stripe"}
            </button>

            <Link
              to="/patient/book-appointment"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-slate-900/40 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/30 hover:text-cyan-200"
            >
              <ArrowLeft size={15} />
              Back to Booking
            </Link>
          </div>
        </section>

        <aside className="rounded-2xl border border-white/10 bg-slate-950/35 p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
            Summary
          </p>

          <div className="mt-4 rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-4">
            <p className="text-xs text-cyan-200">Total Payable</p>
            <p className="mt-2 text-3xl font-black text-white">{formatCurrency(amount)}</p>
            <p className="mt-2 text-xs text-slate-300">Currency: USD</p>
          </div>

          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <p>1. Slot is reserved before payment capture.</p>
            <p>2. You will be redirected to Stripe Sandbox checkout.</p>
            <p>3. You will be redirected to the confirmation page.</p>
          </div>
        </aside>
      </div>
    </PortalLayout>
  );
};

export default Checkout;
