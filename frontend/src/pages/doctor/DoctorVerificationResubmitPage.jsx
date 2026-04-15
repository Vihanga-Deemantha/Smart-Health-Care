import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  FileUp,
  Link2,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud
} from "lucide-react";
import toast from "react-hot-toast";
import { resubmitDoctorVerification } from "../../services/authApi.js";
import { useAuth } from "../../hooks/useAuth.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";

const parseLinks = (value) =>
  String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

const statusMeta = {
  CHANGES_REQUESTED: {
    badge: "Needs updates",
    tone: "border-amber-400/30 bg-amber-500/10 text-amber-100",
    panel:
      "border-amber-400/25 bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.18),_transparent_38%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(120,53,15,0.26))]",
    title: "Your verification needs a few updates",
    description:
      "An admin reviewed your submission and requested changes. Refresh your supporting files or links and send an improved package for review."
  },
  REJECTED: {
    badge: "Re-submit required",
    tone: "border-rose-400/30 bg-rose-500/10 text-rose-100",
    panel:
      "border-rose-400/20 bg-[radial-gradient(circle_at_top_right,_rgba(248,113,113,0.18),_transparent_36%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(127,29,29,0.28))]",
    title: "Your verification submission was not approved",
    description:
      "You can still submit a stronger verification package. Add clearer evidence, corrected credentials, or better supporting links before re-submitting."
  },
  PENDING: {
    badge: "Under review",
    tone: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
    panel:
      "border-emerald-400/20 bg-[radial-gradient(circle_at_top_right,_rgba(52,211,153,0.18),_transparent_36%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(6,95,70,0.24))]",
    title: "Your verification is under review",
    description:
      "Your latest submission is already with the admin team. You can review the information on this page while waiting for the final decision."
  }
};

const nextStepCards = [
  {
    title: "Update evidence",
    text: "Add corrected documents, new certifications, or better credential proof."
  },
  {
    title: "Submit once",
    text: "Send one clean verification package so the review team sees the latest version."
  },
  {
    title: "Wait for review",
    text: "After submission, your status switches back to pending until an admin reviews it."
  }
];

const DoctorVerificationResubmitPage = () => {
  const { user, accessToken, setAuth } = useAuth();
  const [files, setFiles] = useState([]);
  const [linksInput, setLinksInput] = useState(
    Array.isArray(user?.verificationLinks) ? user.verificationLinks.join("\n") : ""
  );
  const [submitting, setSubmitting] = useState(false);

  const verificationStatus = user?.doctorVerificationStatus || "PENDING";
  const currentMeta = statusMeta[verificationStatus] || statusMeta.PENDING;
  const isAwaitingReview = verificationStatus === "PENDING";
  const canResubmit = ["CHANGES_REQUESTED", "REJECTED"].includes(verificationStatus);
  const uploadedDocs = Array.isArray(user?.verificationDocuments) ? user.verificationDocuments : [];
  const linkList = useMemo(() => parseLinks(linksInput), [linksInput]);
  const selectedFilesLabel = files.length
    ? `${files.length} file${files.length === 1 ? "" : "s"} selected`
    : "No new files selected yet";

  const handleFilesChange = (event) => {
    setFiles(Array.from(event.target.files || []));
  };

  const handleRemoveFile = (nameToRemove) => {
    setFiles((current) => current.filter((file) => `${file.name}-${file.size}` !== nameToRemove));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canResubmit) {
      return;
    }

    if (!files.length && !linkList.length) {
      toast.error("Add at least one verification file or one supporting link.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await resubmitDoctorVerification({
        verificationFiles: files,
        verificationLinks: linkList
      });
      const nextUser = response.data?.data?.user ?? null;
      setAuth(nextUser, accessToken);
      setFiles([]);
      toast.success("Verification details re-submitted successfully.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to re-submit verification details."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section
        className={`overflow-hidden rounded-[30px] border p-7 shadow-[0_24px_60px_-32px_rgba(15,118,110,0.55)] ${currentMeta.panel}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100">
              <ShieldCheck size={14} />
              Doctor Verification
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              {currentMeta.title}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200/90">
              {currentMeta.description}
            </p>
          </div>
          <div className="min-w-[220px] rounded-3xl border border-white/10 bg-slate-950/45 p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Current Status
            </div>
            <div className="mt-3 inline-flex rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white">
              {currentMeta.badge}
            </div>
            <div className="mt-4 text-sm text-slate-300">
              {verificationStatus.replaceAll("_", " ")}
            </div>
          </div>
        </div>

        <div className="mt-7 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
              Files on Record
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">{uploadedDocs.length}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
              Links on Record
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {Array.isArray(user?.verificationLinks) ? user.verificationLinks.length : 0}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
              Specialization
            </div>
            <div className="mt-2 text-base font-semibold text-white">
              {user?.specialization || "-"}
            </div>
          </div>
        </div>
      </section>

      {user?.doctorRejectionReason ? (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 shrink-0" size={18} />
            <div>
              <p className="font-semibold">Admin feedback</p>
              <p className="mt-1 leading-6">{user.doctorRejectionReason}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.95fr)]">
        <section className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-[#01696f]/30 bg-[#01696f]/10 p-3 text-[#7be0e6]">
              <UploadCloud size={18} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Prepare your updated submission</h3>
              <p className="text-sm text-slate-400">
                {canResubmit
                  ? "Send your latest documents and supporting links as one updated package."
                  : "Your latest verification package is already with the review team."}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {nextStepCards.map((card, index) => (
              <div
                key={card.title}
                className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4"
              >
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#01696f]/15 text-xs font-bold text-[#7be0e6]">
                  {index + 1}
                </div>
                <div className="mt-3 text-sm font-semibold text-white">{card.title}</div>
                <div className="mt-1 text-sm leading-6 text-slate-400">{card.text}</div>
              </div>
            ))}
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div className="rounded-3xl border border-slate-800/80 bg-slate-950/55 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Link2 size={16} className="text-cyan-300" />
                Supporting links
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Add one URL per line for hospital profiles, licensing references, professional directories, or portfolio pages.
              </p>
              <textarea
                rows={6}
                value={linksInput}
                onChange={(event) => setLinksInput(event.target.value)}
                disabled={!canResubmit || submitting}
                placeholder={"https://portfolio.example.com\nhttps://hospital.example.com/profile"}
                className="mt-4 w-full rounded-2xl border border-slate-800/80 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-[#0ea5a4]/50 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <div className="mt-3 text-xs text-slate-500">
                Current draft contains {linkList.length} supporting link{linkList.length === 1 ? "" : "s"}.
              </div>
            </div>

            <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/55 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <FileText size={16} className="text-cyan-300" />
                    Verification files
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Upload corrected license proof, updated qualification scans, or clearer credential evidence.
                  </p>
                </div>

                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-[#0ea5a4]/50 hover:text-[#7be0e6]">
                  <FileUp size={16} />
                  Select files
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFilesChange}
                    disabled={!canResubmit || submitting}
                  />
                </label>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Selection</div>
                <div className="mt-2 text-sm text-white">{selectedFilesLabel}</div>

                {files.length ? (
                  <div className="mt-4 space-y-2">
                    {files.map((file) => (
                      <div
                        key={`${file.name}-${file.size}`}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-[#01696f]/20 bg-[#01696f]/8 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-[#c4f5f7]">
                            {file.name}
                          </div>
                          <div className="mt-1 text-xs text-slate-400">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(`${file.name}-${file.size}`)}
                          className="rounded-xl border border-rose-400/25 bg-rose-500/10 p-2 text-rose-200 transition hover:bg-rose-500/15"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    Upload medical license proof, qualification files, or updated certification evidence.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800/80 bg-slate-950/60 px-4 py-4">
              <div className="text-sm text-slate-400">
                {canResubmit
                  ? "When you re-submit, your status will return to pending while the admin team reviews the latest package."
                  : "No action needed right now. Your latest submission is already pending review."}
              </div>
              <button
                type="submit"
                disabled={!canResubmit || submitting}
                className="rounded-2xl bg-[#01696f] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_34px_-20px_rgba(1,105,111,0.95)] transition hover:bg-[#028a93] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Re-submit for review"}
              </button>
            </div>
          </form>
        </section>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Sparkles size={16} className="text-cyan-300" />
              Verification checklist
            </div>
            <div className="mt-4 space-y-3">
              {[
                "Use clear, recent, and readable credential documents.",
                "Only include links that directly support your clinical identity.",
                "Make sure your updated evidence addresses the admin feedback.",
                "Submit one complete package to avoid fragmented review."
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-3"
                >
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-300" />
                  <p className="text-sm leading-6 text-slate-300">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
              Current account details
            </h3>
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Doctor</div>
                <div className="mt-2 text-sm font-semibold text-white">{user?.fullName || "-"}</div>
              </div>
              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">License Number</div>
                <div className="mt-2 text-sm font-semibold text-white">
                  {user?.medicalLicenseNumber || "-"}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Specialization</div>
                <div className="mt-2 text-sm font-semibold text-white">
                  {user?.specialization || "-"}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <FileCheck2 size={16} className="text-cyan-300" />
              Current submission summary
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Files on record</div>
                <div className="mt-2 text-sm text-white">{uploadedDocs.length}</div>
              </div>
              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Links on record</div>
                <div className="mt-2 text-sm text-white">
                  {Array.isArray(user?.verificationLinks) ? user.verificationLinks.length : 0}
                </div>
              </div>
            </div>

            {Array.isArray(user?.verificationLinks) && user.verificationLinks.length ? (
              <div className="mt-4 space-y-2">
                {user.verificationLinks.map((link) => (
                  <a
                    key={link}
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-3 text-sm text-cyan-200 transition hover:border-[#0ea5a4]/40"
                  >
                    {link}
                  </a>
                ))}
              </div>
            ) : null}
          </section>

          <section className={`rounded-3xl border p-6 text-sm ${currentMeta.tone}`}>
            <div className="flex items-start gap-3">
              <Clock3 size={18} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">
                  {isAwaitingReview ? "Review in progress" : "After you submit"}
                </p>
                <p className="mt-2 leading-6">
                  {isAwaitingReview
                    ? "Your latest verification details are already under review. Stay on this page to review your submission while waiting for the admin decision."
                    : "Your status will switch back to pending and the latest files and links will replace the previous verification package."}
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default DoctorVerificationResubmitPage;
