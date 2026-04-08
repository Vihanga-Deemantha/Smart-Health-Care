const SectionHeading = ({ eyebrow, title, description, align = "left" }) => {
  return (
    <div className={align === "center" ? "text-center" : ""}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300/85">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">{description}</p>
      ) : null}
    </div>
  );
};

export default SectionHeading;
