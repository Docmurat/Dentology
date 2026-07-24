import { Section } from "@/components/layout/section";

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
          <p className="mb-5 text-xs uppercase tracking-[0.18em] text-[var(--color-gray-500)] sm:text-sm sm:tracking-[0.22em]">
            {eyebrow}
          </p>
        ) : null}

        <h1 className="break-words text-2xl font-semibold leading-[1.15] text-[var(--color-navy)] sm:text-3xl sm:leading-[1.1] md:text-4xl">
          {title}
        </h1>

        {description ? (
          <p className="mt-5 max-w-3xl text-base leading-7 text-[var(--color-gray-700)] md:mt-6 md:text-lg md:leading-8">
            {description}
          </p>
        ) : null}
      </div>
    </Section>
  );
}