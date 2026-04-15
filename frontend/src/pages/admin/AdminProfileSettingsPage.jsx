import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Camera, KeyRound, ShieldCheck, Trash2, UserRound } from "lucide-react";
import SectionHeading from "../../components/common/SectionHeading.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import {
  changeCurrentAdminPassword,
  getCurrentAdminProfile,
  removeCurrentAdminProfilePhoto,
  updateCurrentAdminProfile,
  uploadCurrentAdminProfilePhoto
} from "../../services/adminApi.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";
import { formatDate } from "../../utils/formatDate.js";

const initialProfileForm = {
  fullName: "",
  phone: "",
  jobTitle: ""
};

const initialPasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: ""
};

const validateProfileForm = (values) => {
  const errors = {};

  if (!values.fullName.trim()) {
    errors.fullName = "Full name is required.";
  } else if (values.fullName.trim().length < 3) {
    errors.fullName = "Full name must be at least 3 characters.";
  }

  if (!values.phone.trim()) {
    errors.phone = "Phone number is required.";
  } else if (values.phone.trim().length < 10 || values.phone.trim().length > 15) {
    errors.phone = "Phone number must be between 10 and 15 characters.";
  }

  if (values.jobTitle.trim() && (values.jobTitle.trim().length < 2 || values.jobTitle.trim().length > 80)) {
    errors.jobTitle = "Job title must be between 2 and 80 characters.";
  }

  return errors;
};

const validatePasswordForm = (values) => {
  const errors = {};

  if (!values.currentPassword) {
    errors.currentPassword = "Current password is required.";
  }

  if (!values.newPassword) {
    errors.newPassword = "New password is required.";
  } else if (
    values.newPassword.length < 8 ||
    !/[A-Z]/.test(values.newPassword) ||
    !/[a-z]/.test(values.newPassword) ||
    !/[0-9]/.test(values.newPassword) ||
    !/[^A-Za-z0-9]/.test(values.newPassword)
  ) {
    errors.newPassword =
      "Use 8+ characters with uppercase, lowercase, number, and special character.";
  } else if (values.newPassword === values.currentPassword) {
    errors.newPassword = "New password must be different from the current password.";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Please confirm the new password.";
  } else if (values.confirmPassword !== values.newPassword) {
    errors.confirmPassword = "Confirmation password does not match.";
  }

  return errors;
};

const AdminProfileSettingsPage = () => {
  const navigate = useNavigate();
  const { user, accessToken, setAuth, clearAuth } = useAuth();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState(initialProfileForm);
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [removingPhoto, setRemovingPhoto] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const response = await getCurrentAdminProfile();
        const admin = response.data?.data?.admin ?? null;

        setProfile(admin);
        setProfileForm({
          fullName: admin?.fullName || "",
          phone: admin?.phone || "",
          jobTitle: admin?.jobTitle || ""
        });
      } catch (error) {
        setErrorMessage(getApiErrorMessage(error, "Unable to load admin profile."));
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const snapshotCards = useMemo(() => {
    if (!profile) {
      return [];
    }

    return [
      {
        label: "Role",
        content: <StatusBadge value={profile.role} />,
        detail: "Access tier assigned to your admin account."
      },
      {
        label: "Account status",
        content: <StatusBadge value={profile.accountStatus} />,
        detail: "Current sign-in availability for this admin account."
      },
      {
        label: "Last login",
        content: (
          <p className="mt-2 text-xl font-black text-[#0B1F3A]">
            {profile.lastLoginAt ? formatDate(profile.lastLoginAt) : "No sign-in yet"}
          </p>
        ),
        detail: "Most recent successful access to the admin workspace."
      }
    ];
  }, [profile]);

  const profileInitials = useMemo(
    () =>
      (profile?.fullName || user?.fullName || "Admin")
        .split(" ")
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase(),
    [profile?.fullName, user?.fullName]
  );

  const syncProfileState = (nextProfile) => {
    if (!nextProfile) {
      return;
    }

    setProfile(nextProfile);
    setProfileForm({
      fullName: nextProfile.fullName || "",
      phone: nextProfile.phone || "",
      jobTitle: nextProfile.jobTitle || ""
    });

    if (accessToken) {
      setAuth(
        {
          ...(user || {}),
          ...nextProfile,
          id: nextProfile.id || nextProfile._id || user?.id,
          _id: nextProfile._id || user?._id
        },
        accessToken
      );
    }
  };

  const handleProfileChange = (field, value) => {
    setProfileForm((current) => ({
      ...current,
      [field]: value
    }));
    setProfileErrors((current) => ({
      ...current,
      [field]: ""
    }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordForm((current) => ({
      ...current,
      [field]: value
    }));
    setPasswordErrors((current) => ({
      ...current,
      [field]: ""
    }));
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    const errors = validateProfileForm(profileForm);
    if (Object.keys(errors).length) {
      setProfileErrors(errors);
      return;
    }

    setSavingProfile(true);

    try {
      const response = await updateCurrentAdminProfile({
        fullName: profileForm.fullName.trim(),
        phone: profileForm.phone.trim(),
        jobTitle: profileForm.jobTitle.trim()
      });
      const nextProfile = response.data?.data?.admin ?? null;

      syncProfileState(nextProfile);

      toast.success("Admin profile updated successfully");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to update admin profile."));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePhotoInputChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Select a valid image file.");
      return;
    }

    setUploadingPhoto(true);

    try {
      const response = await uploadCurrentAdminProfilePhoto(file);
      const nextProfile = response.data?.data?.admin ?? null;

      syncProfileState(nextProfile);
      toast.success("Profile photo updated successfully");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to update profile photo."));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    setRemovingPhoto(true);

    try {
      const response = await removeCurrentAdminProfilePhoto();
      const nextProfile = response.data?.data?.admin ?? null;

      syncProfileState(nextProfile);
      toast.success("Profile photo removed successfully");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to remove profile photo."));
    } finally {
      setRemovingPhoto(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    const errors = validatePasswordForm(passwordForm);
    if (Object.keys(errors).length) {
      setPasswordErrors(errors);
      return;
    }

    setSavingPassword(true);

    try {
      await changeCurrentAdminPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      toast.success("Password updated. Please sign in again.");
      await clearAuth();
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to update password."));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Admin settings"
        title="Manage your admin profile and access security"
        description="Keep your account details current and rotate your password when access hygiene needs attention."
        tone="dark"
      />

      {loading ? (
        <div className="rounded-[28px] border border-[#E0E7EF] bg-white px-6 py-10 text-center shadow-[0_10px_30px_rgba(47,128,237,0.08)]">
          <p className="text-sm text-[#5C708A]">Loading your admin profile...</p>
        </div>
      ) : errorMessage && !profile ? (
        <div className="rounded-[24px] border border-[#F5C6C1] bg-[#FFF6F5] px-5 py-4">
          <h3 className="text-base font-semibold text-[#C0392B]">Admin settings are unavailable</h3>
          <p className="mt-2 text-sm leading-6 text-[#8E4B42]">{errorMessage}</p>
          <Link
            to="/admin"
            className="mt-4 inline-flex rounded-2xl bg-[#2F80ED] px-4 py-2 text-sm font-semibold text-white"
          >
            Return to dashboard
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {snapshotCards.map((card) => (
              <div
                key={card.label}
                className="rounded-[24px] border border-[#E0E7EF] bg-white px-5 py-4 shadow-[0_10px_30px_rgba(47,128,237,0.08)]"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5C708A]">
                  {card.label}
                </p>
                {card.content}
                <p className="mt-2 text-sm leading-6 text-[#5C708A]">{card.detail}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[28px] border border-[#E0E7EF] bg-white p-6 shadow-[0_10px_30px_rgba(47,128,237,0.08)]">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-[#EEF4FF] text-[#2F80ED]">
                  <UserRound size={26} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5C708A]">
                    Profile details
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-[#0B1F3A]">
                    Update your administrator identity
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[#5C708A]">
                    These details appear across the admin workspace and help other operators
                    identify the current account owner.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-5 rounded-[24px] border border-[#E0E7EF] bg-[#F9FBFF] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  {profile?.profilePhoto?.url ? (
                    <img
                      src={profile.profilePhoto.url}
                      alt={profile.fullName || "Admin"}
                      className="h-20 w-20 rounded-[24px] object-cover shadow-[0_10px_30px_rgba(47,128,237,0.16)]"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#EEF4FF] text-2xl font-black text-[#2F80ED]">
                      {profileInitials}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-[#1D2D50]">Profile photo</p>
                    <p className="mt-1 text-sm leading-6 text-[#5C708A]">
                      Upload a clear square image to personalize your admin workspace.
                    </p>
                    <p className="mt-1 text-xs leading-6 text-[#8BA0B8]">
                      PNG, JPG, or WEBP up to 5 MB.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={handlePhotoInputChange}
                  />
                  <button
                    type="button"
                    disabled={uploadingPhoto}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#2F80ED] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    <Camera size={16} />
                    {uploadingPhoto
                      ? "Uploading..."
                      : profile?.profilePhoto?.url
                        ? "Replace photo"
                        : "Upload photo"}
                  </button>
                  {profile?.profilePhoto?.url ? (
                    <button
                      type="button"
                      disabled={removingPhoto}
                      onClick={handleRemovePhoto}
                      className="inline-flex items-center gap-2 rounded-2xl border border-[#F4C2BD] bg-[#FDEEEE] px-4 py-3 text-sm font-semibold text-[#C0392B] disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                      {removingPhoto ? "Removing..." : "Remove"}
                    </button>
                  ) : null}
                </div>
              </div>

              <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSaveProfile}>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-[#1D2D50]">Email address</span>
                  <input
                    value={profile?.email || ""}
                    disabled
                    className="w-full rounded-2xl border border-[#E0E7EF] bg-[#F4F7FB] px-4 py-3 text-sm text-[#8BA0B8] outline-none"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-[#1D2D50]">Full name</span>
                  <input
                    value={profileForm.fullName}
                    onChange={(event) => handleProfileChange("fullName", event.target.value)}
                    className="w-full rounded-2xl border border-[#E0E7EF] bg-[#F9FBFF] px-4 py-3 text-sm text-[#1D2D50] outline-none placeholder:text-[#8BA0B8]"
                    placeholder="Enter your full name"
                  />
                  {profileErrors.fullName ? (
                    <p className="text-sm text-[#EB5757]">{profileErrors.fullName}</p>
                  ) : null}
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-[#1D2D50]">Phone number</span>
                  <input
                    value={profileForm.phone}
                    onChange={(event) => handleProfileChange("phone", event.target.value)}
                    className="w-full rounded-2xl border border-[#E0E7EF] bg-[#F9FBFF] px-4 py-3 text-sm text-[#1D2D50] outline-none placeholder:text-[#8BA0B8]"
                    placeholder="Enter your phone number"
                  />
                  {profileErrors.phone ? (
                    <p className="text-sm text-[#EB5757]">{profileErrors.phone}</p>
                  ) : null}
                </label>

                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-[#1D2D50]">Job title</span>
                  <input
                    value={profileForm.jobTitle}
                    onChange={(event) => handleProfileChange("jobTitle", event.target.value)}
                    className="w-full rounded-2xl border border-[#E0E7EF] bg-[#F9FBFF] px-4 py-3 text-sm text-[#1D2D50] outline-none placeholder:text-[#8BA0B8]"
                    placeholder="Examples: Operations Admin, Platform Lead"
                  />
                  <p className="text-xs leading-6 text-[#8BA0B8]">
                    Optional. Leave blank if you do not want a role description shown.
                  </p>
                  {profileErrors.jobTitle ? (
                    <p className="text-sm text-[#EB5757]">{profileErrors.jobTitle}</p>
                  ) : null}
                </label>

                <div className="flex flex-wrap gap-3 md:col-span-2">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="rounded-2xl bg-[#2F80ED] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {savingProfile ? "Saving profile..." : "Save profile"}
                  </button>
                </div>
              </form>
            </div>

            <div className="space-y-6">
              <div className="rounded-[28px] border border-[#E0E7EF] bg-white p-6 shadow-[0_10px_30px_rgba(47,128,237,0.08)]">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-[#FFF4E8] text-[#F2994A]">
                    <ShieldCheck size={26} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5C708A]">
                      Account overview
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-[#0B1F3A]">
                      Workspace identity
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-[#5C708A]">
                      Account created {profile?.createdAt ? formatDate(profile.createdAt) : "-"}.
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-3 rounded-[24px] border border-[#E0E7EF] bg-[#F9FBFF] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-[#5C708A]">Email verified</span>
                    <StatusBadge value={profile?.isEmailVerified ? "ACTIVE" : "PENDING"} />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-[#5C708A]">Admin role</span>
                    <StatusBadge value={profile?.role} />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-[#5C708A]">Account status</span>
                    <StatusBadge value={profile?.accountStatus} />
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-[#E0E7EF] bg-white p-6 shadow-[0_10px_30px_rgba(47,128,237,0.08)]">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-[#EEF7FF] text-[#2F80ED]">
                    <KeyRound size={26} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5C708A]">
                      Password security
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-[#0B1F3A]">
                      Change your password
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-[#5C708A]">
                      After a successful password change, you'll be signed out and asked to log in
                      again.
                    </p>
                  </div>
                </div>

                <form className="mt-6 space-y-4" onSubmit={handleChangePassword}>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-[#1D2D50]">Current password</span>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(event) =>
                        handlePasswordChange("currentPassword", event.target.value)
                      }
                      className="w-full rounded-2xl border border-[#E0E7EF] bg-[#F9FBFF] px-4 py-3 text-sm text-[#1D2D50] outline-none"
                      placeholder="Enter your current password"
                    />
                    {passwordErrors.currentPassword ? (
                      <p className="text-sm text-[#EB5757]">{passwordErrors.currentPassword}</p>
                    ) : null}
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-[#1D2D50]">New password</span>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(event) =>
                        handlePasswordChange("newPassword", event.target.value)
                      }
                      className="w-full rounded-2xl border border-[#E0E7EF] bg-[#F9FBFF] px-4 py-3 text-sm text-[#1D2D50] outline-none"
                      placeholder="Create a new strong password"
                    />
                    {passwordErrors.newPassword ? (
                      <p className="text-sm text-[#EB5757]">{passwordErrors.newPassword}</p>
                    ) : (
                      <p className="text-xs leading-6 text-[#8BA0B8]">
                        Use 8+ characters with uppercase, lowercase, number, and special
                        character.
                      </p>
                    )}
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-[#1D2D50]">Confirm new password</span>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(event) =>
                        handlePasswordChange("confirmPassword", event.target.value)
                      }
                      className="w-full rounded-2xl border border-[#E0E7EF] bg-[#F9FBFF] px-4 py-3 text-sm text-[#1D2D50] outline-none"
                      placeholder="Re-enter the new password"
                    />
                    {passwordErrors.confirmPassword ? (
                      <p className="text-sm text-[#EB5757]">{passwordErrors.confirmPassword}</p>
                    ) : null}
                  </label>

                  {/* Action footer */}
                  <div className="mt-2 border-t border-[#E0E7EF] pt-5">
                    <button
                      type="submit"
                      disabled={savingPassword}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(11,31,58,0.4)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg, #0B1F3A, #1D3A6B)" }}
                    >
                      <KeyRound size={15} />
                      {savingPassword ? "Updating password…" : "Update password"}
                    </button>
                    <p className="mt-3 text-center text-[11px] leading-5 text-[#8BA0B8]">
                      You will be signed out immediately after a successful password change.
                    </p>
                  </div>
                </form>

              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminProfileSettingsPage;
