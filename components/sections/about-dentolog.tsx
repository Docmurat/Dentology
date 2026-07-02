import { Section } from "@/components/layout/section";
import { getAboutContent } from "@/lib/homepage";

export async function AboutDentology() {
  const about = await getAboutContent();

  return (
    <Section className="py-8 md:py-10">
      <div className="rounded-[24px] bg-[var(--color-teal)]/10 px-6 py-6 md:px-8">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-teal)]">
          {about.eyebrow}
        </p>

        <p className="mt-3 text-base leading-7 text-[var(--color-navy)] md:text-lg">
          {about.text1}
        </p>

        {about.text2 ? (
          <p className="mt-2 text-sm text-[var(--color-gray-700)]">
            {about.text2}
          </p>
        ) : null}
      </div>
    </Section>
  );
}