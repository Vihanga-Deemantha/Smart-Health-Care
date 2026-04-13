const SectionHeading = ({ eyebrow, title, description, align = "left", tone = "light" }) => {
  const eyebrowClass =
    tone === "dark" ? "text-[#5C708A]" : "text-cyan-300/85";
  const titleClass = tone === "dark" ? "text-[#0B1F3A]" : "text-white";
  const descriptionClass = tone === "dark" ? "text-[#5C708A]" : "text-slate-300";

  return (
    <div className={align === "center" ? "text-center" : ""}>
      {eyebrow ? (
        <p className={`text-xs font-semibold uppercase tracking-[0.32em] ${eyebrowClass}`}>
          {eyebrow}
        </p>
      ) : null}
      <h2 className={`mt-3 text-3xl font-semibold tracking-tight sm:text-4xl ${titleClass}`}>
        {title}
      </h2>
      {description ? (
        <p className={`mt-3 max-w-2xl text-sm leading-7 ${descriptionClass}`}>{description}</p>
      ) : null}
    </div>
  );
};

export default SectionHeading;
