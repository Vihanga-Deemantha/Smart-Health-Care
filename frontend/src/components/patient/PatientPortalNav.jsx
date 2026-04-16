import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/dashboard", label: "Overview", end: true },
  { to: "/profile", label: "Profile" },
  { to: "/reports", label: "Reports" },
  { to: "/history", label: "History" },
  { to: "/ai-chat", label: "AI Chat" }
];

const PatientPortalNav = () => {
  return (
    <div className="mb-6 flex flex-wrap gap-2.5">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `inline-flex items-center justify-center rounded-full px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.22em] uppercase transition-all ${
              isActive ? "text-white" : "text-slate-300 hover:text-white"
            }`
          }
          style={({ isActive }) => ({
            minHeight: "32px",
            background: isActive
              ? "linear-gradient(135deg, rgba(14,165,233,0.95), rgba(34,211,238,0.9))"
              : "rgba(148, 163, 184, 0.08)",
            border: isActive ? "1px solid rgba(34,211,238,0.65)" : "1px solid rgba(148,163,184,0.16)",
            boxShadow: isActive ? "0 10px 24px rgba(14,165,233,0.28)" : "none",
            letterSpacing: "0.18em"
          })}
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  );
};

export default PatientPortalNav;
