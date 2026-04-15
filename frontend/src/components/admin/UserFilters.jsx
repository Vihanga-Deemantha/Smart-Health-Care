import { Filter, RotateCcw } from "lucide-react";
import { accountStatusOptions, userRoleOptions } from "../../utils/constants.js";
import SearchInput from "../common/SearchInput.jsx";

const UserFilters = ({ filters, onChange }) => {
  return (
    <div className="rounded-[28px] border border-[#E0E7EF] bg-white p-5 shadow-[0_10px_30px_rgba(47,128,237,0.08)]">
      <div className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#5C708A]">
        <Filter size={14} />
        Filter controls
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.3fr_repeat(2,0.7fr)_auto]">
        <SearchInput
          value={filters.search}
          onChange={(value) => onChange("search", value)}
          placeholder="Search by name or email"
        />
        <select
          value={filters.role}
          onChange={(event) => onChange("role", event.target.value)}
          className="rounded-2xl border border-[#E0E7EF] bg-[#F9FBFF] px-4 py-3 text-sm text-[#1D2D50] outline-none"
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
          className="rounded-2xl border border-[#E0E7EF] bg-[#F9FBFF] px-4 py-3 text-sm text-[#1D2D50] outline-none"
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
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#E0E7EF] bg-[#F9FBFF] px-4 py-3 text-sm font-semibold text-[#1D2D50] transition hover:border-[#2F80ED]/40 hover:text-[#2F80ED]"
        >
          <RotateCcw size={15} />
          Clear filters
        </button>
      </div>
    </div>
  );
};

export default UserFilters;
