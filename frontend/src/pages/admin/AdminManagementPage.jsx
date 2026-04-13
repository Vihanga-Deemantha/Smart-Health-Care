import { useCallback, useEffect, useMemo, useState } from "react";
import { ShieldCheck, Trash2, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import SectionHeading from "../../components/common/SectionHeading.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import Pagination from "../../components/common/Pagination.jsx";
import SearchInput from "../../components/common/SearchInput.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { createAdmin, deleteAdmin, getAdmins } from "../../services/adminApi.js";
import { useDebounce } from "../../hooks/useDebounce.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  password: ""
};

const validateCreateAdminForm = (values) => {
  const errors = {};

  if (!values.fullName.trim()) {
    errors.fullName = "Full name is required.";
  }

  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.phone.trim()) {
    errors.phone = "Phone number is required.";
  } else if (values.phone.trim().length < 10 || values.phone.trim().length > 15) {
    errors.phone = "Phone number must be between 10 and 15 characters.";
  }

  const password = values.password;

  if (!password) {
    errors.password = "Password is required.";
  } else if (
    password.length < 8 ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)
  ) {
    errors.password =
      "Use 8+ characters with uppercase, lowercase, number, and special character.";
  }

  return errors;
};

const AdminManagementPage = () => {
  const [filters, setFilters] = useState({
    search: "",
    page: 1
  });
  const [adminsData, setAdminsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState(initialForm);
  const [createErrors, setCreateErrors] = useState({});
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteDraft, setDeleteDraft] = useState(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const debouncedSearch = useDebounce(filters.search);

  const params = useMemo(
    () => ({
      page: filters.page,
      limit: 8,
      search: debouncedSearch || undefined
    }),
    [filters.page, debouncedSearch]
  );

  const snapshotMetrics = useMemo(() => {
    const admins = adminsData?.admins || [];
    const totalAdmins = adminsData?.pagination?.total || 0;

    return [
      {
        label: "Admin accounts",
        value: totalAdmins,
        detail: "All administrator accounts currently registered in the platform."
      },
      {
        label: "Super admins",
        value: admins.filter((admin) => admin.role === "SUPER_ADMIN").length,
        detail: "High-trust accounts visible in the current results."
      },
      {
        label: "Active admins",
        value: admins.filter((admin) => admin.accountStatus === "ACTIVE").length,
        detail: "Admin accounts that can sign in and operate right now."
      }
    ];
  }, [adminsData]);

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await getAdmins(params);
      setAdminsData(response.data?.data);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to load admin accounts."));
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
      page: field === "page" ? value : 1
    }));
  };

  const openCreateModal = () => {
    setCreateForm(initialForm);
    setCreateErrors({});
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setCreateForm(initialForm);
    setCreateErrors({});
    setIsCreateModalOpen(false);
  };

  const handleCreateChange = (field, value) => {
    setCreateForm((current) => ({
      ...current,
      [field]: value
    }));
    setCreateErrors((current) => ({
      ...current,
      [field]: ""
    }));
  };

  const handleCreateAdmin = async (event) => {
    event.preventDefault();

    const nextErrors = validateCreateAdminForm(createForm);
    if (Object.keys(nextErrors).length) {
      setCreateErrors(nextErrors);
      return;
    }

    setCreateLoading(true);

    try {
      await createAdmin({
        fullName: createForm.fullName.trim(),
        email: createForm.email.trim(),
        phone: createForm.phone.trim(),
        password: createForm.password
      });

      toast.success("Admin account created successfully");
      closeCreateModal();
      await loadAdmins();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to create admin account."));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!deleteDraft?._id) {
      return;
    }

    setDeleteLoadingId(deleteDraft._id);

    try {
      await deleteAdmin(deleteDraft._id);
      toast.success("Admin account deleted successfully");
      setDeleteDraft(null);
      await loadAdmins();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to delete admin account."));
    } finally {
      setDeleteLoadingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Admin management"
        title="Control who can operate the admin workspace"
        description="Create administrator accounts, review elevated access, and remove admin users when access should no longer remain active."
        tone="dark"
      />

      <div className="grid gap-4 md:grid-cols-3">
        {snapshotMetrics.map((item) => (
          <div
            key={item.label}
            className="rounded-[24px] border border-[#E0E7EF] bg-white px-5 py-4 shadow-[0_10px_30px_rgba(47,128,237,0.08)]"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5C708A]">
              {item.label}
            </p>
            <p className="mt-2 text-3xl font-black text-[#0B1F3A]">{item.value}</p>
            <p className="mt-2 text-sm leading-6 text-[#5C708A]">{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 rounded-[28px] border border-[#E0E7EF] bg-white p-5 shadow-[0_10px_30px_rgba(47,128,237,0.08)] lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5C708A]">
            Access control
          </p>
          <h3 className="mt-2 text-xl font-semibold text-[#0B1F3A]">
            Manage trusted operators without leaving the dashboard
          </h3>
          <p className="mt-2 text-sm leading-7 text-[#5C708A]">
            New accounts created here are standard admins. Only super admins can access this page
            and remove administrator accounts.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="min-w-[280px]">
            <SearchInput
              value={filters.search}
              onChange={(value) => handleFilterChange("search", value)}
              placeholder="Search by admin name or email"
            />
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2F80ED] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1C6ED5]"
          >
            <UserPlus size={18} />
            Create admin
          </button>
        </div>
      </div>

      {errorMessage && !adminsData?.admins?.length && !loading ? (
        <div className="rounded-[24px] border border-[#F5C6C1] bg-[#FFF6F5] px-5 py-4">
          <h3 className="text-base font-semibold text-[#C0392B]">Admin directory is unavailable</h3>
          <p className="mt-2 text-sm leading-6 text-[#8E4B42]">{errorMessage}</p>
          <button
            type="button"
            onClick={loadAdmins}
            className="mt-4 rounded-2xl bg-[#2F80ED] px-4 py-2 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </div>
      ) : null}

      {loading ? (
        <LoadingSpinner label="Loading admin accounts" />
      ) : errorMessage && !adminsData?.admins?.length ? null : adminsData?.admins?.length ? (
        <>
          <div className="overflow-hidden rounded-[28px] border border-[#E0E7EF] bg-white shadow-[0_10px_30px_rgba(47,128,237,0.08)]">
            <div className="flex items-center justify-between border-b border-[#E0E7EF] bg-[#F9FBFF] px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5C708A]">
                  Admin directory
                </p>
                <p className="mt-1 text-sm text-[#5C708A]">
                  Review elevated accounts before granting or removing access.
                </p>
              </div>
              <div className="rounded-2xl border border-[#E0E7EF] bg-white px-4 py-3 text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5C708A]">
                  Loaded admins
                </p>
                <p className="mt-1 text-xl font-black text-[#0B1F3A]">
                  {adminsData.admins.length}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E0E7EF] text-sm">
                <thead className="bg-[#F9FBFF] text-left text-[#5C708A]">
                  <tr>
                    <th className="px-5 py-4 font-medium">Admin</th>
                    <th className="px-5 py-4 font-medium">Role</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 font-medium">Email verified</th>
                    <th className="px-5 py-4 font-medium">Created</th>
                    <th className="px-5 py-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF3F8]">
                  {adminsData.admins.map((admin) => {
                    const isSuperAdmin = admin.role === "SUPER_ADMIN";

                    return (
                      <tr
                        key={admin._id}
                        className="text-[#4A6078] transition hover:bg-[#F9FBFF]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#2F80ED]">
                              <ShieldCheck size={18} />
                            </div>
                            <div>
                              <div className="font-medium text-[#1D2D50]">{admin.fullName}</div>
                              <div>{admin.email}</div>
                              <div className="text-xs text-[#8BA0B8]">{admin.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge value={admin.role} />
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge value={admin.accountStatus} />
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge value={admin.isEmailVerified ? "ACTIVE" : "PENDING"} />
                        </td>
                        <td className="px-5 py-4">
                          {new Date(admin.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {isSuperAdmin ? (
                            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8BA0B8]">
                              Protected
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={deleteLoadingId === admin._id}
                              onClick={() => setDeleteDraft(admin)}
                              className="inline-flex items-center gap-2 rounded-xl border border-[#F4C2BD] bg-[#FDEEEE] px-4 py-2 text-xs font-semibold text-[#C0392B] disabled:opacity-50"
                            >
                              <Trash2 size={14} />
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            page={adminsData.pagination?.page || 1}
            pages={adminsData.pagination?.pages || 1}
            onChange={(page) => handleFilterChange("page", page)}
          />
        </>
      ) : (
        <div className="rounded-[28px] border border-[#E0E7EF] bg-white p-10 text-center shadow-[0_10px_30px_rgba(47,128,237,0.08)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#EEF4FF] text-[#2F80ED]">
            <ShieldCheck size={28} />
          </div>
          <h3 className="mt-6 text-xl font-semibold text-[#0B1F3A]">
            No admin accounts matched this search
          </h3>
          <p className="mt-2 text-sm leading-7 text-[#5C708A]">
            Clear the search or create a new administrator account to expand the workspace team.
          </p>
        </div>
      )}

      {isCreateModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F3A]/35 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] border border-[#E0E7EF] bg-white p-6 shadow-[0_20px_50px_rgba(11,31,58,0.18)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2F80ED]">
              Create admin
            </p>
            <h3 className="mt-3 text-xl font-semibold text-[#1D2D50]">
              Add a new administrator
            </h3>
            <p className="mt-2 text-sm text-[#5C708A]">
              This account will be created as a regular admin with full current admin workspace
              access, but without super-admin powers.
            </p>

            <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleCreateAdmin}>
              <label className="space-y-2">
                <span className="text-sm font-medium text-[#1D2D50]">Full name</span>
                <input
                  value={createForm.fullName}
                  onChange={(event) => handleCreateChange("fullName", event.target.value)}
                  className="w-full rounded-2xl border border-[#E0E7EF] bg-[#F9FBFF] px-4 py-3 text-sm text-[#1D2D50] outline-none placeholder:text-[#8BA0B8]"
                  placeholder="Enter admin full name"
                />
                {createErrors.fullName ? (
                  <p className="text-sm text-[#EB5757]">{createErrors.fullName}</p>
                ) : null}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-[#1D2D50]">Phone number</span>
                <input
                  value={createForm.phone}
                  onChange={(event) => handleCreateChange("phone", event.target.value)}
                  className="w-full rounded-2xl border border-[#E0E7EF] bg-[#F9FBFF] px-4 py-3 text-sm text-[#1D2D50] outline-none placeholder:text-[#8BA0B8]"
                  placeholder="Enter admin phone number"
                />
                {createErrors.phone ? (
                  <p className="text-sm text-[#EB5757]">{createErrors.phone}</p>
                ) : null}
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-[#1D2D50]">Email address</span>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(event) => handleCreateChange("email", event.target.value)}
                  className="w-full rounded-2xl border border-[#E0E7EF] bg-[#F9FBFF] px-4 py-3 text-sm text-[#1D2D50] outline-none placeholder:text-[#8BA0B8]"
                  placeholder="Enter admin email address"
                />
                {createErrors.email ? (
                  <p className="text-sm text-[#EB5757]">{createErrors.email}</p>
                ) : null}
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-[#1D2D50]">Temporary password</span>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(event) => handleCreateChange("password", event.target.value)}
                  className="w-full rounded-2xl border border-[#E0E7EF] bg-[#F9FBFF] px-4 py-3 text-sm text-[#1D2D50] outline-none placeholder:text-[#8BA0B8]"
                  placeholder="Create a strong temporary password"
                />
                <p className="text-xs leading-6 text-[#8BA0B8]">
                  Use at least 8 characters with uppercase, lowercase, number, and special
                  character.
                </p>
                {createErrors.password ? (
                  <p className="text-sm text-[#EB5757]">{createErrors.password}</p>
                ) : null}
              </label>

              <div className="mt-2 flex flex-wrap gap-3 md:col-span-2">
                <button
                  type="submit"
                  disabled={createLoading}
                  className="rounded-2xl bg-[#2F80ED] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {createLoading ? "Creating admin..." : "Create admin"}
                </button>
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="rounded-2xl border border-[#E0E7EF] px-5 py-3 text-sm font-semibold text-[#1D2D50]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteDraft ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F3A]/35 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[28px] border border-[#E0E7EF] bg-white p-6 shadow-[0_20px_50px_rgba(11,31,58,0.18)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#EB5757]">
              Remove admin
            </p>
            <h3 className="mt-3 text-xl font-semibold text-[#1D2D50]">
              Remove {deleteDraft.fullName}?
            </h3>
            <p className="mt-2 text-sm leading-7 text-[#5C708A]">
              This will permanently delete the selected admin account from the system. This action
              cannot be undone.
            </p>

            <div className="mt-5 rounded-2xl border border-[#E0E7EF] bg-[#F9FBFF] px-4 py-4 text-sm text-[#4A6078]">
              <p className="font-medium text-[#1D2D50]">{deleteDraft.email}</p>
              <p className="mt-1">{deleteDraft.phone}</p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={deleteLoadingId === deleteDraft._id}
                onClick={handleDeleteAdmin}
                className="rounded-2xl bg-[#EB5757] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {deleteLoadingId === deleteDraft._id ? "Removing..." : "Confirm removal"}
              </button>
              <button
                type="button"
                onClick={() => setDeleteDraft(null)}
                className="rounded-2xl border border-[#E0E7EF] px-5 py-3 text-sm font-semibold text-[#1D2D50]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminManagementPage;
