import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import SectionHeading from "../../components/common/SectionHeading.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import ErrorState from "../../components/common/ErrorState.jsx";
import Pagination from "../../components/common/Pagination.jsx";
import UserFilters from "../../components/admin/UserFilters.jsx";
import UserTable from "../../components/admin/UserTable.jsx";
import { getUsers, updateUserStatus } from "../../services/adminApi.js";
import { useDebounce } from "../../hooks/useDebounce.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";

const UsersManagementPage = () => {
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    accountStatus: "",
    page: 1
  });
  const [usersData, setUsersData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const debouncedSearch = useDebounce(filters.search);

  const params = useMemo(
    () => ({
      page: filters.page,
      limit: 10,
      role: filters.role || undefined,
      accountStatus: filters.accountStatus || undefined,
      search: debouncedSearch || undefined
    }),
    [filters.page, filters.role, filters.accountStatus, debouncedSearch]
  );

  const loadUsers = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await getUsers(params);
      setUsersData(response.data?.data);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to load users."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [debouncedSearch, filters.role, filters.accountStatus, filters.page]);

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
      page: field === "page" ? value : 1
    }));
  };

  const handleToggleStatus = async (id, status) => {
    setUpdatingUserId(id);
    try {
      await updateUserStatus(id, { status });
      toast.success(`User ${status === "SUSPENDED" ? "suspended" : "activated"} successfully`);
      await loadUsers();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to update user status."));
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="User management"
        title="Search, filter, and control platform access"
        description="Search accounts, review status, and manage access across the platform."
      />

      <UserFilters filters={filters} onChange={handleFilterChange} />

      {errorMessage && !usersData?.users?.length && !loading ? (
        <ErrorState
          title="User directory is unavailable"
          description={errorMessage}
          onRetry={loadUsers}
        />
      ) : null}

      {errorMessage && usersData?.users?.length ? (
        <div className="rounded-[24px] border border-amber-400/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
          {errorMessage}
        </div>
      ) : null}

      {loading ? (
        <LoadingSpinner label="Loading users" />
      ) : errorMessage && !usersData?.users?.length ? null : usersData?.users?.length ? (
        <>
          <UserTable
            users={usersData.users}
            updatingUserId={updatingUserId}
            onToggleStatus={handleToggleStatus}
          />
          <Pagination
            page={usersData.pagination?.page || 1}
            pages={usersData.pagination?.pages || 1}
            onChange={(page) => handleFilterChange("page", page)}
          />
        </>
      ) : (
        <EmptyState
          title="No users match the current filters"
          description="Try a broader search, remove filters, or wait for new registrations to appear."
        />
      )}
    </div>
  );
};

export default UsersManagementPage;
