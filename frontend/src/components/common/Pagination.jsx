const Pagination = ({ page, pages, onChange }) => {
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3">
      <p className="text-sm text-slate-300">
        Page {page} of {pages}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= pages}
          className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
