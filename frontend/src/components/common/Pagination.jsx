const Pagination = ({ page, pages, onChange }) => {
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#E0E7EF] bg-white px-4 py-3 shadow-[0_10px_30px_rgba(47,128,237,0.05)]">
      <p className="text-sm text-[#5C708A]">
        Page {page} of {pages}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="rounded-xl border border-[#E0E7EF] bg-[#F9FBFF] px-4 py-2 text-sm text-[#1D2D50] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= pages}
          className="rounded-xl bg-[#2F80ED] px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
