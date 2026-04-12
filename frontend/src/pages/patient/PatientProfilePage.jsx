import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import PortalLayout from "../../components/common/PortalLayout.jsx";
import PatientPortalNav from "../../components/patient/PatientPortalNav.jsx";
import { fetchPatientProfile, updatePatientProfile } from "../../api/patientApi.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";

const bloodGroups = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const toDateInput = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
};

const PatientProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    dateOfBirth: "",
    bloodGroup: "",
    contactNumber: "",
    address: "",
    allergies: "",
    medicalNotes: ""
  });

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);

      try {
        const response = await fetchPatientProfile();
        const profile = response.data?.data || {};

        setForm({
          fullName: profile.fullName || "",
          email: profile.email || "",
          dateOfBirth: toDateInput(profile.dateOfBirth),
          bloodGroup: profile.bloodGroup || "",
          contactNumber: profile.contactNumber || "",
          address: profile.address || "",
          allergies: Array.isArray(profile.allergies) ? profile.allergies.join(", ") : "",
          medicalNotes: profile.medicalNotes || ""
        });
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Unable to load profile."));
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const allergiesList = useMemo(
    () =>
      form.allergies
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    [form.allergies]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      await updatePatientProfile({
        fullName: form.fullName,
        email: form.email || null,
        dateOfBirth: form.dateOfBirth || null,
        bloodGroup: form.bloodGroup || null,
        contactNumber: form.contactNumber || null,
        address: form.address || null,
        allergies: allergiesList,
        medicalNotes: form.medicalNotes || null
      });

      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to update profile."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PortalLayout
      eyebrow="Patient Workspace"
      title="Profile"
      description="Keep your personal and medical profile up to date for better care coordination."
      accent="cyan"
    >
      <PatientPortalNav />

      {loading ? (
        <p className="text-sm text-slate-300">Loading profile...</p>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-xs font-semibold text-slate-200">
            Full Name
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              required
              className="rounded-xl border border-slate-600 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
            />
          </label>

          <label className="flex flex-col gap-2 text-xs font-semibold text-slate-200">
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="rounded-xl border border-slate-600 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
            />
          </label>

          <label className="flex flex-col gap-2 text-xs font-semibold text-slate-200">
            Date of Birth
            <input
              type="date"
              name="dateOfBirth"
              value={form.dateOfBirth}
              onChange={handleChange}
              className="rounded-xl border border-slate-600 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
            />
          </label>

          <label className="flex flex-col gap-2 text-xs font-semibold text-slate-200">
            Blood Group
            <select
              name="bloodGroup"
              value={form.bloodGroup}
              onChange={handleChange}
              className="rounded-xl border border-slate-600 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
            >
              {bloodGroups.map((group) => (
                <option key={group || "none"} value={group}>
                  {group || "Select blood group"}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-xs font-semibold text-slate-200">
            Contact Number
            <input
              name="contactNumber"
              value={form.contactNumber}
              onChange={handleChange}
              className="rounded-xl border border-slate-600 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
            />
          </label>

          <label className="flex flex-col gap-2 text-xs font-semibold text-slate-200 md:col-span-2">
            Address
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              className="rounded-xl border border-slate-600 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
            />
          </label>

          <label className="flex flex-col gap-2 text-xs font-semibold text-slate-200 md:col-span-2">
            Allergies (comma separated)
            <input
              name="allergies"
              value={form.allergies}
              onChange={handleChange}
              className="rounded-xl border border-slate-600 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
            />
          </label>

          <label className="flex flex-col gap-2 text-xs font-semibold text-slate-200 md:col-span-2">
            Medical Notes
            <textarea
              name="medicalNotes"
              rows={4}
              value={form.medicalNotes}
              onChange={handleChange}
              className="rounded-xl border border-slate-600 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
            />
          </label>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-cyan-500 px-5 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      )}
    </PortalLayout>
  );
};

export default PatientProfilePage;
