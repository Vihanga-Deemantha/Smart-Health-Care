import { useEffect, useState } from "react";
import { Plus, Upload, X } from "lucide-react";
import api from "../../api/axios.js";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";

const emptyQualification = {
  title: "",
  institution: "",
  year: "",
  documentUrl: "",
  notes: "",
  file: null
};

const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Something went wrong.";

const DoctorProfile = () => {
  const [doctorId, setDoctorId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingQualification, setUploadingQualification] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [profile, setProfile] = useState({
    specialtiesInput: "",
    contactNumber: "",
    address: "",
    hospitalId: "",
    consultationFee: "",
    yearsOfExperience: "",
    bio: "",
    licenseNumber: "",
    isAvailable: true,
    profilePhoto: ""
  });

  const [qualifications, setQualifications] = useState([emptyQualification]);

  const resolveDoctorId = async () => {
    const storedUserId = localStorage.getItem("userId");

    if (!storedUserId) {
      return null;
    }

    const response = await api.get("/api/doctors");
    const doctors = response.data?.data?.doctors || response.data?.doctors || [];
    const match = doctors.find((doctor) => String(doctor.userId) === String(storedUserId));

    return match?._id || null;
  };

  const ensureDoctorProfile = async () => {
    const existingId = await resolveDoctorId();

    if (existingId) {
      return existingId;
    }

    const meResponse = await api.get("/api/auth/me");
    const user = meResponse.data?.data?.user;

    if (!user?.id || !user?.medicalLicenseNumber) {
      throw new Error("Doctor profile not found. Please complete your registration first.");
    }

    const createPayload = {
      userId: user.id,
      licenseNumber: user.medicalLicenseNumber,
      specialties: user.specialization ? [user.specialization] : [],
      contactNumber: user.phone || null,
      isAvailable: true,
      yearsOfExperience: user.yearsOfExperience || 0,
      bio: user.bio || null
    };

    const created = await api.post("/api/doctors", createPayload);
    const doctor = created.data?.data?.doctor || created.data?.doctor;

    if (!doctor?._id) {
      throw new Error("Unable to create doctor profile. Please contact support.");
    }

    return doctor._id;
  };

  const loadProfile = async () => {
    setLoading(true);
    setError("");

    try {
      const id = await ensureDoctorProfile();
      setDoctorId(id);

      const response = await api.get(`/api/doctors/${id}`);
      const doctor = response.data?.data?.doctor || response.data?.doctor;

      setProfile({
        specialtiesInput: (doctor?.specialties || []).join(", "),
        contactNumber: doctor?.contactNumber || "",
        address: doctor?.address || "",
        hospitalId: doctor?.hospitalId || "",
        consultationFee:
          doctor?.consultationFee !== undefined && doctor?.consultationFee !== null
            ? String(doctor.consultationFee)
            : "",
        yearsOfExperience:
          doctor?.yearsOfExperience !== undefined && doctor?.yearsOfExperience !== null
            ? String(doctor.yearsOfExperience)
            : "",
        bio: doctor?.bio || "",
        licenseNumber: doctor?.licenseNumber || "",
        isAvailable: doctor?.isAvailable ?? true,
        profilePhoto: doctor?.profilePhoto || ""
      });

      if (Array.isArray(doctor?.qualifications) && doctor.qualifications.length) {
        setQualifications(
          doctor.qualifications.map((qualification) => ({
            title: qualification.title || "",
            institution: qualification.institution || "",
            year: qualification.year ? String(qualification.year) : "",
            documentUrl: qualification.documentUrl || "",
            notes: qualification.notes || "",
            file: null
          }))
        );
      } else {
        setQualifications([emptyQualification]);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const updateProfileField = (key, value) => {
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const updateQualification = (index, key, value) => {
    setQualifications((current) =>
      current.map((qualification, idx) =>
        idx === index ? { ...qualification, [key]: value } : qualification
      )
    );
  };

  const addQualification = () => {
    setQualifications((current) => [...current, { ...emptyQualification }]);
  };

  const removeQualification = (index) => {
    setQualifications((current) => current.filter((_, idx) => idx !== index));
  };

  const handleUploadProfilePhoto = async (file) => {
    if (!file || !doctorId) {
      return;
    }

    setUploadingPhoto(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post(`/api/doctors/${doctorId}/profile/photo`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const doctor = response.data?.data?.doctor || response.data?.doctor;

      if (doctor?.profilePhoto) {
        updateProfileField("profilePhoto", doctor.profilePhoto);
      }

      setSuccess("Profile photo updated successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleUploadQualification = async (index) => {
    const qualification = qualifications[index];

    if (!qualification?.file || !doctorId) {
      setError("Please select a file before uploading.");
      return;
    }

    setUploadingQualification(index);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", qualification.file);
      formData.append("title", qualification.title);
      formData.append("institution", qualification.institution);
      formData.append("year", qualification.year);
      formData.append("notes", qualification.notes);

      const response = await api.post(
        `/api/doctors/${doctorId}/qualifications/upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const doctor = response.data?.data?.doctor || response.data?.doctor;
      const nextQualifications = Array.isArray(doctor?.qualifications)
        ? doctor.qualifications.map((item) => ({
            title: item.title || "",
            institution: item.institution || "",
            year: item.year ? String(item.year) : "",
            documentUrl: item.documentUrl || "",
            notes: item.notes || "",
            file: null
          }))
        : [emptyQualification];

      setQualifications(nextQualifications);
      setSuccess("Qualification document uploaded.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploadingQualification(null);
    }
  };

  const handleSave = async () => {
    if (!doctorId) {
      setError("Doctor profile not ready yet.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const specialties = profile.specialtiesInput
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const payload = {
        hospitalId: profile.hospitalId || null,
        contactNumber: profile.contactNumber || null,
        address: profile.address || null,
        consultationFee:
          profile.consultationFee === "" ? 0 : Number(profile.consultationFee),
        yearsOfExperience:
          profile.yearsOfExperience === "" ? 0 : Number(profile.yearsOfExperience),
        specialties,
        bio: profile.bio || null,
        licenseNumber: profile.licenseNumber || null,
        isAvailable: Boolean(profile.isAvailable),
        profilePhoto: profile.profilePhoto || null,
        qualifications: qualifications
          .map((qualification) => ({
            title: qualification.title?.trim(),
            institution: qualification.institution?.trim() || null,
            year: qualification.year ? Number(qualification.year) : null,
            documentUrl: qualification.documentUrl?.trim() || null,
            notes: qualification.notes?.trim() || null
          }))
          .filter((qualification) => qualification.title)
      };

      const response = await api.patch(`/api/doctors/${doctorId}/profile`, payload);
      const doctor = response.data?.data?.doctor || response.data?.doctor;

      setSuccess("Profile updated successfully.");

      if (doctor?.qualifications) {
        setQualifications(
          doctor.qualifications.map((item) => ({
            title: item.title || "",
            institution: item.institution || "",
            year: item.year ? String(item.year) : "",
            documentUrl: item.documentUrl || "",
            notes: item.notes || "",
            file: null
          }))
        );
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-6">
        <h2 className="text-xl font-semibold text-white">Doctor Profile</h2>
        <p className="text-sm text-slate-400">
          Manage your specialization, contact details, qualifications, and profile photo.
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-6">
          <LoadingSpinner label="Loading profile..." />
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {success}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Specialization & Details
            </h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Specialties
                <input
                  type="text"
                  value={profile.specialtiesInput}
                  onChange={(event) => updateProfileField("specialtiesInput", event.target.value)}
                  className="rounded-xl border border-slate-800/80 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  placeholder="Cardiology, Internal Medicine"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                License Number
                <input
                  type="text"
                  value={profile.licenseNumber}
                  onChange={(event) => updateProfileField("licenseNumber", event.target.value)}
                  className="rounded-xl border border-slate-800/80 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  placeholder="MBBS 123456"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Hospital
                <input
                  type="text"
                  value={profile.hospitalId}
                  onChange={(event) => updateProfileField("hospitalId", event.target.value)}
                  className="rounded-xl border border-slate-800/80 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  placeholder="St. Joseph Hospital"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Contact Number
                <input
                  type="text"
                  value={profile.contactNumber}
                  onChange={(event) => updateProfileField("contactNumber", event.target.value)}
                  className="rounded-xl border border-slate-800/80 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  placeholder="+1 555 0123"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 md:col-span-2">
                Address
                <input
                  type="text"
                  value={profile.address}
                  onChange={(event) => updateProfileField("address", event.target.value)}
                  className="rounded-xl border border-slate-800/80 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  placeholder="Hospital address"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Consultation Fee
                <input
                  type="number"
                  min="0"
                  value={profile.consultationFee}
                  onChange={(event) => updateProfileField("consultationFee", event.target.value)}
                  className="rounded-xl border border-slate-800/80 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Years of Experience
                <input
                  type="number"
                  min="0"
                  value={profile.yearsOfExperience}
                  onChange={(event) => updateProfileField("yearsOfExperience", event.target.value)}
                  className="rounded-xl border border-slate-800/80 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 md:col-span-2">
                Bio / About
                <textarea
                  rows={4}
                  value={profile.bio}
                  onChange={(event) => updateProfileField("bio", event.target.value)}
                  className="rounded-xl border border-slate-800/80 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                />
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={profile.isAvailable}
                  onChange={(event) => updateProfileField("isAvailable", event.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                />
                Available for appointments
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Qualifications
              </h3>
              <button
                type="button"
                onClick={addQualification}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-900/60 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-[#01696f]/40 hover:text-[#7be0e6]"
              >
                <Plus size={14} /> Add qualification
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {qualifications.map((qualification, index) => (
                <div
                  key={`qualification-${index}`}
                  className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Degree / Certification
                      <input
                        type="text"
                        value={qualification.title}
                        onChange={(event) => updateQualification(index, "title", event.target.value)}
                        className="rounded-xl border border-slate-800/80 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      University / Institution
                      <input
                        type="text"
                        value={qualification.institution}
                        onChange={(event) => updateQualification(index, "institution", event.target.value)}
                        className="rounded-xl border border-slate-800/80 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Year
                      <input
                        type="number"
                        min="1900"
                        max="2100"
                        value={qualification.year}
                        onChange={(event) => updateQualification(index, "year", event.target.value)}
                        className="rounded-xl border border-slate-800/80 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Document URL
                      <input
                        type="text"
                        value={qualification.documentUrl}
                        onChange={(event) => updateQualification(index, "documentUrl", event.target.value)}
                        className="rounded-xl border border-slate-800/80 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                        placeholder="https://"
                      />
                    </label>
                  </div>

                  <label className="mt-4 flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Notes
                    <textarea
                      rows={2}
                      value={qualification.notes}
                      onChange={(event) => updateQualification(index, "notes", event.target.value)}
                      className="rounded-xl border border-slate-800/80 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                    />
                  </label>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-900/60 px-3 py-2 text-xs font-semibold text-slate-200">
                      <Upload size={14} />
                      <input
                        type="file"
                        className="hidden"
                        onChange={(event) =>
                          updateQualification(index, "file", event.target.files?.[0] || null)
                        }
                      />
                      Upload document
                    </label>

                    <button
                      type="button"
                      onClick={() => handleUploadQualification(index)}
                      disabled={uploadingQualification === index}
                      className="rounded-xl bg-[#01696f] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#028a93] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {uploadingQualification === index ? "Uploading..." : "Save document"}
                    </button>

                    {qualifications.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeQualification(index)}
                        className="inline-flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200"
                      >
                        <X size={14} /> Remove
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-[#01696f] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#028a93] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? "Saving..." : "Save profile"}
          </button>
        </div>

        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            Profile Photo
          </h3>
          <div className="mt-4 flex flex-col items-center gap-4">
            <div className="h-36 w-36 overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950">
              {profile.profilePhoto ? (
                <img
                  src={profile.profilePhoto}
                  alt="Doctor profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                  No photo
                </div>
              )}
            </div>
            <label className="inline-flex items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-900/60 px-4 py-2 text-xs font-semibold text-slate-200">
              <Upload size={14} />
              <input
                type="file"
                className="hidden"
                onChange={(event) => handleUploadProfilePhoto(event.target.files?.[0] || null)}
              />
              {uploadingPhoto ? "Uploading..." : "Upload photo"}
            </label>
            <input
              type="text"
              value={profile.profilePhoto}
              onChange={(event) => updateProfileField("profilePhoto", event.target.value)}
              className="w-full rounded-xl border border-slate-800/80 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              placeholder="Photo URL"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
