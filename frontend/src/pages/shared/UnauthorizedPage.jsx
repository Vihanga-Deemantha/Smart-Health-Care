import { Link } from "react-router-dom";
import EmptyState from "../../components/common/EmptyState.jsx";

const UnauthorizedPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-xl">
        <EmptyState
          title="You do not have access to this area"
          description="This section is reserved for a different permission level. Sign in with the right account or return to a safe route."
          action={
            <Link
              to="/login"
              className="inline-flex rounded-2xl bg-linear-to-r from-cyan-400 via-blue-500 to-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950"
            >
              Return to login
            </Link>
          }
        />
      </div>
    </div>
  );
};

export default UnauthorizedPage;
