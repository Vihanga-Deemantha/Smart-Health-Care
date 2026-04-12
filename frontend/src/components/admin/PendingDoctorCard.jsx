import { useState } from "react";
import { formatDate } from "../../utils/formatDate.js";
import StatusBadge from "../common/StatusBadge.jsx";

const PendingDoctorCard = ({ doctor, onApprove, onReject, loading }) => {
  const [reason, setReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [rejectError, setRejectError] = useState("");

  return (
    <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6 shadow-[0_30px_80px_-44px_rgba(6,182,212,0.4)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-white">{doctor.fullName}</h3>
          <p className="mt-1 text-sm text-slate-300">{doctor.email}</p>
          <p className="text-sm text-slate-400">{doctor.phone}</p>
        </div>
        <StatusBadge value={doctor.doctorVerificationStatus} />
      </div>

      <dl className="mt-6 grid gap-4 text-sm text-slate-300 sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">License</dt>
          <dd className="mt-1 text-white">{doctor.medicalLicenseNumber || "-"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Specialization</dt>
          <dd className="mt-1 text-white">{doctor.specialization || "-"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Experience</dt>
          <dd className="mt-1 text-white">{doctor.yearsOfExperience ?? 0} years</dd>
        </div>
        <div>
          <dt className="text-slate-500">Submitted</dt>
          <dd className="mt-1 text-white">{formatDate(doctor.createdAt)}</dd>
        </div>
      </dl>

      {Array.isArray(doctor.qualificationDocuments) && doctor.qualificationDocuments.length ? (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Qualification documents
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {doctor.qualificationDocuments.map((item) => (
              <span key={item} className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">
                {item}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {showReject ? (
        <div className="mt-5 space-y-3">
          <textarea
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setRejectError("");
            }}
            placeholder="Share a clear rejection reason"
            className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
          />
          {rejectError ? <p className="text-sm text-rose-300">{rejectError}</p> : null}
          <div className="flex gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                if (!reason.trim()) {
                  setRejectError("A rejection reason helps the doctor understand what needs attention.");
                  return;
                }

                onReject(doctor._id, reason.trim());
              }}
              className="rounded-2xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              Confirm rejection
            </button>
            <button
              type="button"
              onClick={() => {
                setShowReject(false);
                setReason("");
                setRejectError("");
              }}
              className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => onApprove(doctor._id)}
            className="rounded-2xl bg-linear-to-r from-cyan-400 to-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
          >
            Approve doctor
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => setShowReject(true)}
            className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-5 py-3 text-sm font-semibold text-rose-200 disabled:opacity-50"
          >
            Reject doctor
          </button>
        </div>
      )}
    </div>
  );
};

export default PendingDoctorCard;
