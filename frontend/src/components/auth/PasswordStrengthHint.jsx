const checks = [
  { label: "8+ characters", test: (value) => value.length >= 8 },
  { label: "Uppercase letter", test: (value) => /[A-Z]/.test(value) },
  { label: "Lowercase letter", test: (value) => /[a-z]/.test(value) },
  { label: "Number", test: (value) => /[0-9]/.test(value) },
  { label: "Special character", test: (value) => /[^A-Za-z0-9]/.test(value) }
];

const PasswordStrengthHint = ({ value = "" }) => {
  return (
    <div className="rounded-2xl bg-slate-100 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
        Password strength
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {checks.map((item) => {
          const passed = item.test(value);

          return (
            <div
              key={item.label}
              className={`rounded-xl px-3 py-2 text-xs font-medium ${
                passed ? "bg-emerald-50 text-emerald-700" : "bg-white text-slate-500"
              }`}
            >
              {item.label}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PasswordStrengthHint;
