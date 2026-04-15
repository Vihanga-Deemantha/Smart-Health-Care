import { useState } from "react";
import { ExternalLink, FileDown, Image as ImageIcon, Link2 } from "lucide-react";
import { formatDate } from "../../utils/formatDate.js";
import StatusBadge from "../common/StatusBadge.jsx";

const formatFileSize = (size) => {
  if (!Number.isFinite(size)) {
    return null;
  }

  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
};

const PendingDoctorCard = ({ doctor, onApprove, onReject, loading }) => {
  const [reason, setReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [rejectError, setRejectError] = useState("");
  const verificationDocuments = Array.isArray(doctor.verificationDocuments)
    ? doctor.verificationDocuments
    : [];
  const verificationLinks = Array.isArray(doctor.verificationLinks)
    ? doctor.verificationLinks
    : [];
  const legacyDocuments =
    !verificationDocuments.length && !verificationLinks.length && Array.isArray(doctor.qualificationDocuments)
      ? doctor.qualificationDocuments
      : [];

  return (
    <div className="rounded-[28px] border border-[#E0E7EF] bg-white p-6 shadow-[0_10px_30px_rgba(47,128,237,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5C708A]">
            Doctor verification
          </p>
          <h3 className="mt-2 text-xl font-semibold text-[#1D2D50]">{doctor.fullName}</h3>
          <p className="mt-1 text-sm text-[#4A6078]">{doctor.email}</p>
          <p className="text-sm text-[#5C708A]">{doctor.phone}</p>
        </div>
        <StatusBadge value={doctor.doctorVerificationStatus} />
      </div>

      <dl className="mt-6 grid gap-4 text-sm text-[#4A6078] sm:grid-cols-2">
        <div className="rounded-2xl border border-[#E0E7EF] bg-[#F9FBFF] px-4 py-3">
          <dt className="text-[#8BA0B8]">License</dt>
          <dd className="mt-1 text-[#1D2D50]">{doctor.medicalLicenseNumber || "-"}</dd>
        </div>
        <div className="rounded-2xl border border-[#E0E7EF] bg-[#F9FBFF] px-4 py-3">
          <dt className="text-[#8BA0B8]">Specialization</dt>
          <dd className="mt-1 text-[#1D2D50]">{doctor.specialization || "-"}</dd>
        </div>
        <div className="rounded-2xl border border-[#E0E7EF] bg-[#F9FBFF] px-4 py-3">
          <dt className="text-[#8BA0B8]">Experience</dt>
          <dd className="mt-1 text-[#1D2D50]">{doctor.yearsOfExperience ?? 0} years</dd>
        </div>
        <div className="rounded-2xl border border-[#E0E7EF] bg-[#F9FBFF] px-4 py-3">
          <dt className="text-[#8BA0B8]">Submitted</dt>
          <dd className="mt-1 text-[#1D2D50]">{formatDate(doctor.createdAt)}</dd>
        </div>
      </dl>

      {verificationDocuments.length ? (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#5C708A]">
            Verification documents
          </p>
          <div className="mt-3 grid gap-3">
            {verificationDocuments.map((item) => {
              const isImage = item.mimeType?.startsWith("image/");

              return (
                <div
                  key={`${item.url}-${item.filename}`}
                  className="overflow-hidden rounded-2xl border border-[#E0E7EF] bg-[#F9FBFF]"
                >
                  {isImage ? (
                    <a href={item.url} target="_blank" rel="noreferrer" className="block">
                      <img
                        src={item.url}
                        alt={item.filename}
                        className="h-44 w-full object-cover"
                      />
                    </a>
                  ) : (
                    <div className="flex h-28 items-center justify-center bg-[#EEF3F8] text-[#8BA0B8]">
                      <ImageIcon size={28} />
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#1D2D50]">{item.filename}</p>
                      <p className="mt-1 text-xs text-[#5C708A]">
                        {[item.mimeType || "Document", formatFileSize(item.size)]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-xl border border-[#E0E7EF] bg-white px-3 py-2 text-xs font-semibold text-[#1D2D50]"
                      >
                        <ExternalLink size={14} />
                        View
                      </a>
                      <a
                        href={item.url}
                        download
                        className="inline-flex items-center gap-1 rounded-xl bg-[#2F80ED] px-3 py-2 text-xs font-semibold text-white"
                      >
                        <FileDown size={14} />
                        Download
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {verificationLinks.length ? (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#5C708A]">
            Supporting links
          </p>
          <div className="mt-3 space-y-2">
            {verificationLinks.map((item) => (
              <a
                key={item}
                href={item}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-2xl border border-[#E0E7EF] bg-[#F9FBFF] px-4 py-3 text-sm text-[#2F80ED] transition hover:border-[#2F80ED]/25 hover:bg-[#EEF5FF]"
              >
                <Link2 size={15} />
                <span className="truncate">{item}</span>
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {legacyDocuments.length ? (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#5C708A]">
            Submitted notes
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {legacyDocuments.map((item) => (
              <span key={item} className="rounded-full bg-[#F3F6FA] px-3 py-1 text-xs text-[#4A6078]">
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
            placeholder="Share the changes the doctor needs to make"
            className="min-h-28 w-full rounded-2xl border border-[#E0E7EF] bg-[#F9FBFF] px-4 py-3 text-sm text-[#1D2D50] outline-none placeholder:text-[#8BA0B8]"
          />
          {rejectError ? <p className="text-sm text-[#EB5757]">{rejectError}</p> : null}
          <div className="flex gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                if (!reason.trim()) {
                  setRejectError("A clear review note helps the doctor understand what needs attention.");
                  return;
                }

                onReject(doctor._id, reason.trim());
              }}
              className="rounded-2xl bg-[#EB5757] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              Request changes
            </button>
            <button
              type="button"
              onClick={() => {
                setShowReject(false);
                setReason("");
                setRejectError("");
              }}
              className="rounded-2xl border border-[#E0E7EF] px-5 py-3 text-sm font-semibold text-[#1D2D50]"
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
            className="rounded-2xl bg-[linear-gradient(135deg,#2F80ED,#56CCF2)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-24px_rgba(47,128,237,0.5)] disabled:opacity-50"
          >
            Approve doctor
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => setShowReject(true)}
            className="rounded-2xl border border-[#F4C2BD] bg-[#FDEEEE] px-5 py-3 text-sm font-semibold text-[#C0392B] disabled:opacity-50"
          >
            Request changes
          </button>
        </div>
      )}
    </div>
  );
};

export default PendingDoctorCard;
