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
    <div className="mb-6 flex flex-wrap gap-2">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `rounded-full px-4 py-2 text-xs font-bold tracking-wide transition-all ${
              isActive ? "text-white" : "text-slate-300 hover:text-white"
            }`
          }
          style={({ isActive }) => ({
            background: isActive ? "linear-gradient(135deg, #0ea5e9, #22d3ee)" : "rgba(148, 163, 184, 0.1)",
            border: isActive ? "1px solid rgba(34,211,238,0.65)" : "1px solid rgba(148,163,184,0.2)",
            boxShadow: isActive ? "0 12px 30px rgba(14,165,233,0.35)" : "none"
          })}
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  );
};

export default PatientPortalNav;
