import { typography } from "@/lib/typography";

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

  const eyebrowColor = inverted
    ? "text-white/60"
    : "text-[var(--color-gray-500)]";
  const titleColor = inverted ? "text-white" : "text-[var(--color-navy)]";
  const descriptionColor = inverted
    ? "text-white/75"
    : "text-[var(--color-gray-700)]";

  return (
    <div className={`max-w-3xl ${alignment}`}>
      {eyebrow ? (
        <p className={`mb-3 sm:mb-4 ${typography.eyebrow} ${eyebrowColor}`}>
          {eyebrow}
        </p>
      ) : null}

      <h2 className={`${typography.h2} ${titleColor}`}>{title}</h2>

      {description ? (
        <p className={`mt-4 sm:mt-5 ${typography.bodyLg} ${descriptionColor}`}>
          {description}
        </p>
      ) : null}
    </div>
  );
}