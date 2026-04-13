import { CalendarDays, ShieldCheck } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";

const AdminTopbar = () => {
  const { user } = useAuth();
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  });

  return (
    <header className="sticky top-0 z-20 border-b border-[#E0E7EF] bg-white px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E0E7EF] bg-[#F5F9FF] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#1D2D50]">
            <ShieldCheck size={13} className="text-[#2F80ED]" />
            Secure workspace session
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#0B1F3A]">
            Welcome back, {user?.fullName || "Admin"}
          </h1>
          <p className="mt-1 text-sm text-[#5C708A]">
            Review platform performance and administrative decisions from one place.
          </p>
        </div>
        <div className="hidden rounded-2xl border border-[#E0E7EF] bg-[#F9FBFF] px-4 py-3 md:block">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#5C708A]">
            <CalendarDays size={14} className="text-[#2F80ED]" />
            Today
          </div>
          <p className="mt-1 text-sm font-semibold text-[#1D2D50]">{todayLabel}</p>
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;
