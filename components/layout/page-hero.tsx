import { Section } from "@/components/layout/section";
import { typography } from "@/lib/typography";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function PageHero({ eyebrow, title, description }: PageHeroProps) {
  return (
    <Section className="pt-14 pb-16 md:pt-18 md:pb-16">
      <div className="max-w-4xl">
        {eyebrow ? (
          <p
            className={`mb-5 ${typography.eyebrow} text-[var(--color-gray-500)]`}
          >
            {eyebrow}
          </p>
        ) : null}

        <h1 className={`${typography.h1} text-[var(--color-navy)]`}>{title}</h1>

        {description ? (
          <p
            className={`mt-5 max-w-3xl md:mt-6 ${typography.bodyLg} text-[var(--color-gray-700)]`}
          >
            {description}
          </p>
        ) : null}
      </div>
    </Section>
  );
}