type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  inverted?: boolean;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  inverted = false,
}: SectionHeadingProps) {
  const alignment = align === "center" ? "text-center mx-auto" : "text-left";

  const eyebrowColor = inverted ? "text-white/60" : "text-[var(--color-gray-500)]";
  const titleColor = inverted ? "text-white" : "text-[var(--color-navy)]";
  const descriptionColor = inverted
    ? "text-white/75"
    : "text-[var(--color-gray-700)]";

  return (
    <div className={`max-w-3xl ${alignment}`}>
      {eyebrow ? (
        <p className={`mb-4 text-sm uppercase tracking-[0.2em] ${eyebrowColor}`}>
          {eyebrow}
        </p>
      ) : null}

      <h2 className={`text-3xl font-semibold leading-tight md:text-4xl ${titleColor}`}>
        {title}
      </h2>

      {description ? (
        <p className={`mt-5 text-base leading-7 md:text-lg md:leading-8 ${descriptionColor}`}>
          {description}
        </p>
      ) : null}
    </div>
  );
}