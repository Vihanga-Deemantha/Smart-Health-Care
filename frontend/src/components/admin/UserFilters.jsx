import { accountStatusOptions, userRoleOptions } from "../../utils/constants.js";
import SearchInput from "../common/SearchInput.jsx";

const UserFilters = ({ filters, onChange }) => {
  return (
    <div className="grid gap-4 rounded-[28px] border border-white/10 bg-slate-900/75 p-5 lg:grid-cols-[1.3fr_repeat(2,0.7fr)_auto]">
      <SearchInput
        value={filters.search}
        onChange={(value) => onChange("search", value)}
        placeholder="Search by name or email"
      />
      <select
        value={filters.role}
        onChange={(event) => onChange("role", event.target.value)}
        className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
      >
        <option value="">All roles</option>
        {userRoleOptions.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
      <select
        value={filters.accountStatus}
        onChange={(event) => onChange("accountStatus", event.target.value)}
        className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
      >
        <option value="">All statuses</option>
        {accountStatusOptions.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => {
          onChange("search", "");
          onChange("role", "");
          onChange("accountStatus", "");
        }}
        className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:text-white"
      >
        Clear filters
      </button>
    </div>
  );
};

export default UserFilters;
