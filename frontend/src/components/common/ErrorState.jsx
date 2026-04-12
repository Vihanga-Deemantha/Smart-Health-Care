import EmptyState from "./EmptyState.jsx";

const ErrorState = ({ title = "Something needs attention", description, onRetry }) => {
  return (
    <EmptyState
      title={title}
      description={description}
      action={
        onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex rounded-2xl bg-linear-to-r from-cyan-400 via-blue-500 to-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950"
          >
            Try again
          </button>
        ) : null
      }
    />
  );
};

export default ErrorState;
