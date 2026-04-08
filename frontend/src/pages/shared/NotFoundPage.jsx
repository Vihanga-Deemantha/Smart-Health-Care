import { Link } from "react-router-dom";
import EmptyState from "../../components/common/EmptyState.jsx";

const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-xl">
        <EmptyState
          title="Page not found"
          description="The route you requested does not exist in the frontend gateway experience."
          action={
            <Link
              to="/"
              className="inline-flex rounded-2xl bg-linear-to-r from-cyan-400 via-blue-500 to-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950"
            >
              Back to home
            </Link>
          }
        />
      </div>
    </div>
  );
};

export default NotFoundPage;
