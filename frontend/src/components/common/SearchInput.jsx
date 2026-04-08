import { Search } from "lucide-react";

const SearchInput = ({ value, onChange, placeholder = "Search" }) => {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3">
      <Search size={18} className="text-slate-400" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
      />
    </label>
  );
};

export default SearchInput;
