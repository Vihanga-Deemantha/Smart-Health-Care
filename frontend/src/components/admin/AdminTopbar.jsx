import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";

const AdminTopbar = () => {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
            Admin control center
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            Welcome back, {user?.fullName || "Admin"}
          </h1>
        </div>
        <button
          type="button"
          onClick={async () => {
            await clearAuth();
            navigate("/login");
          }}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </header>
  );
};

export default AdminTopbar;
