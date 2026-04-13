import { CheckCircle2, Circle } from "lucide-react";

const checks = [
  { label: "8+ characters",     test: (v) => v.length >= 8 },
  { label: "Uppercase letter",  test: (v) => /[A-Z]/.test(v) },
  { label: "Lowercase letter",  test: (v) => /[a-z]/.test(v) },
  { label: "Number",            test: (v) => /[0-9]/.test(v) },
  { label: "Special character", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const PasswordStrengthHint = ({ value = "" }) => {
  const passedCount = checks.filter((c) => c.test(value)).length;
  const strength =
    passedCount === 0 ? null :
    passedCount <= 2   ? { label: "Weak",   color: "#EB5757",  bar: 1 } :
    passedCount <= 3   ? { label: "Fair",   color: "#F2994A",  bar: 2 } :
    passedCount <= 4   ? { label: "Good",   color: "#2F80ED",  bar: 3 } :
                         { label: "Strong", color: "#27AE60",  bar: 4 };

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "rgba(47,128,237,0.04)", border: "1px solid rgba(47,128,237,0.1)" }}
    >
      {/* Top row: label + strength bar */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#0B1F3A" }}>
          Password Strength
        </p>
        {strength && (
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: strength.color }}>
            {strength.label}
          </span>
        )}
      </div>

      {/* Strength bar segments */}
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4].map((seg) => (
          <div
            key={seg}
            className="h-1.5 flex-1 rounded-full transition-all duration-500"
            style={{
              background: strength && seg <= strength.bar ? strength.color : "rgba(47,128,237,0.12)",
            }}
          />
        ))}
      </div>

      {/* Checks grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {checks.map((item) => {
          const passed = item.test(value);
          return (
            <div key={item.label} className="flex items-center gap-1.5">
              {passed
                ? <CheckCircle2 size={12} style={{ color: "#27AE60", flexShrink: 0 }} />
                : <Circle size={12} style={{ color: "rgba(47,128,237,0.25)", flexShrink: 0 }} />
              }
              <span
                className="text-[11px] font-medium transition-colors duration-300"
                style={{ color: passed ? "#27AE60" : "#94a3b8" }}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PasswordStrengthHint;
