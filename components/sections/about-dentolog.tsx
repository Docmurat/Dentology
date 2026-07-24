import { Section } from "@/components/layout/section";
import { getAboutContent } from "@/lib/homepage";

export async function AboutDentology() {
  const about = await getAboutContent();

  return (
    <Section className="py-8 md:py-10">
      <div className="rounded-[24px] bg-[var(--color-teal)]/10 px-4 py-5 sm:px-6 sm:py-6 md:px-8">
        <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-teal)] sm:text-sm sm:tracking-[0.2em]">
          {about.eyebrow}
        </p>

        <p className="mt-2 text-sm leading-6 text-[var(--color-navy)] sm:mt-3 sm:text-base sm:leading-7 md:text-lg">
          {about.text1}
        </p>

        {about.text2 ? (
          <p className="mt-2 text-xs text-[var(--color-gray-700)] sm:text-sm">
            {about.text2}
          </p>
        ) : null}
      </div>
    </Section>
  );
}