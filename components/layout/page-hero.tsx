import { Section } from "@/components/layout/section";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function PageHero({ eyebrow, title, description }: PageHeroProps) {
  return (
    <Section className="pt-14 pb-16 md:pt-18 md:pb-40">
      <div className="max-w-4xl">
        {eyebrow ? (
          <p className="mb-5 text-sm uppercase tracking-[0.22em] text-[var(--color-gray-500)]">
            {eyebrow}
          </p>
        ) : null}

        <h1 className="text-3xl font-semibold leading-[1.1] text-[var(--color-navy)] md:text-4xl">
          {title}
        </h1>

        {description ? (
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--color-gray-700)]">
            {description}
          </p>
        ) : null}
      </div>
    </Section>
  );
}