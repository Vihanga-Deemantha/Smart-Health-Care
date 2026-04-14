import { Search } from "lucide-react";

const SearchInput = ({ value, onChange, placeholder = "Search" }) => {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-[#E0E7EF] bg-[#F9FBFF] px-4 py-3">
      <Search size={18} className="text-[#5C708A]" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-[#1D2D50] outline-none placeholder:text-[#8BA0B8]"
      />
    </label>
  );
};

export default SearchInput;
