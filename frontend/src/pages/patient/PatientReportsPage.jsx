import { useEffect, useState } from "react";
import { Download, Trash2, UploadCloud } from "lucide-react";
import toast from "react-hot-toast";
import PortalLayout from "../../components/common/PortalLayout.jsx";
import PatientPortalNav from "../../components/patient/PatientPortalNav.jsx";
import {
  deletePatientReport,
  fetchPatientReports,
  uploadPatientReport
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

const PatientReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingIdentifier, setDeletingIdentifier] = useState(null);

  const loadReports = async () => {
    setLoading(true);

    try {
      const response = await fetchPatientReports();
      setReports(response.data?.data || []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to load reports."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!file) {
      toast.error("Please choose a file first.");
      return;
    }

    setUploading(true);

    try {
      await uploadPatientReport(file);
      toast.success("Report uploaded successfully");
      setFile(null);
      await loadReports();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Report upload failed."));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (report) => {
    const publicId = typeof report?.publicId === "string" ? report.publicId : "";
    const url = typeof report?.url === "string" ? report.url : "";
    const reportIdentifier = publicId || url;

    if (!reportIdentifier) {
      toast.error("This report cannot be deleted because it has no identifier.");
      return;
    }

    const confirmed = window.confirm(
      `Delete \"${report.filename}\"? This action cannot be undone.`
    );
    if (!confirmed) {
      return;
    }

    setDeletingIdentifier(reportIdentifier);

    try {
      await deletePatientReport({ publicId, url });
      toast.success("Report deleted successfully");
      setReports((current) =>
        current.filter((item) => {
          if (publicId) {
            return item.publicId !== publicId;
          }

          return item.url !== url;
        })
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to delete report."));
    } finally {
      setDeletingIdentifier(null);
    }
  };

  return (
    <PortalLayout
      eyebrow="Patient Workspace"
      title="Medical Reports"
      description="Upload medical reports and access your previously uploaded files."
      accent="cyan"
    >
      <PatientPortalNav />

      <form
        onSubmit={handleUpload}
        className="rounded-2xl border border-slate-700/70 bg-slate-950/45 p-5"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-200">Upload Report</p>
        <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-cyan-400/60 bg-cyan-400/5 p-7 text-center">
          <UploadCloud size={24} className="text-cyan-300" />
          <span className="mt-2 text-sm font-semibold text-white">
            {file ? file.name : "Choose report file (PDF, DOC, JPG, PNG)"}
          </span>
          <span className="mt-1 text-xs text-slate-300">Click to browse from your device</span>
          <input
            type="file"
            className="hidden"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
        </label>

        <button
          type="submit"
          disabled={uploading}
          className="mt-4 rounded-xl bg-cyan-500 px-5 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? "Uploading..." : "Upload File"}
        </button>
      </form>

      <div className="mt-6 rounded-2xl border border-slate-700/70 bg-slate-950/45 p-5">
        <h3 className="text-sm font-bold text-white">Uploaded Reports</h3>

        {loading ? (
          <p className="mt-3 text-sm text-slate-300">Loading reports...</p>
        ) : reports.length === 0 ? (
          <p className="mt-3 text-sm text-slate-300">No reports uploaded yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {reports.map((report, index) => (
              <div
                key={report.publicId || `${report.filename}-${index}`}
                className="flex flex-col gap-3 rounded-xl border border-slate-700/70 bg-slate-950/70 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{report.filename}</p>
                  <p className="mt-1 text-xs text-slate-300">Uploaded: {formatDate(report.uploadDate)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={report.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-slate-700"
                  >
                    <Download size={13} /> Download
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(report)}
                    disabled={
                      (!report.publicId && !report.url) ||
                      deletingIdentifier === (report.publicId || report.url)
                    }
                    className="inline-flex items-center gap-1 rounded-lg bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 size={13} />
                    {deletingIdentifier === (report.publicId || report.url) ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default PatientReportsPage;
