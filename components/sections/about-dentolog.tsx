import { Section } from "@/components/layout/section";
import { getAboutContent } from "@/lib/homepage";
import { typography } from "@/lib/typography";

export async function AboutDentology() {
  const about = await getAboutContent();

  return (
    <Section className="py-8 md:py-10">
      <div className="rounded-[24px] bg-[var(--color-teal)]/10 px-4 py-5 sm:px-6 sm:py-6 md:px-8">
        <p className={`${typography.eyebrow} text-[var(--color-teal)]`}>
          {about.eyebrow}
        </p>

        <p className={`mt-2 sm:mt-3 ${typography.bodyLg} text-[var(--color-navy)]`}>
          {about.text1}
        </p>

        {about.text2 ? (
          <p className={`mt-2 ${typography.caption} text-[var(--color-gray-700)]`}>
            {about.text2}
          </p>
        ) : null}
      </div>
    </Section>
  );
}