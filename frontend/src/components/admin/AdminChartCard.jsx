const AdminChartCard = ({
  eyebrow,
  title,
  description,
  metric,
  metricLabel,
  children,
  className = ""
}) => {
  return (
    <section
      className={`rounded-[24px] border border-[#E0E7EF] bg-white p-5 shadow-[0_10px_30px_rgba(47,128,237,0.08)] ${className}`.trim()}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {eyebrow ? (
            <p className="text-[10px] font-extrabold uppercase tracking-[0.26em] text-[#5C708A]">
              {eyebrow}
            </p>
          ) : null}
          <h3 className="mt-2 text-base font-black tracking-tight text-[#1D2D50] sm:text-lg">
            {title}
          </h3>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5C708A]">{description}</p>
          ) : null}
        </div>

        {metric !== undefined ? (
          <div className="rounded-2xl border border-[#E0E7EF] bg-[#F9FBFF] px-4 py-3 text-left sm:text-right">
            {metricLabel ? (
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C708A]">
                {metricLabel}
              </p>
            ) : null}
            <p className="mt-1 text-2xl font-black text-[#0B1F3A]">{metric}</p>
          </div>
        ) : null}
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
};

export default AdminChartCard;
