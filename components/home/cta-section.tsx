import Link from "next/link";
import { Section } from "@/components/layout/section";
import { getCtaContent } from "@/lib/homepage";
import { ContactButton } from "@/components/contact/contact-modal";
import { typography } from "@/lib/typography";

export async function CtaSection() {
  const cta = await getCtaContent();

  return (
    <Section className="py-20 md:py-28">
      <div className="rounded-[32px] bg-[var(--color-navy)] px-5 py-8 text-white sm:px-6 sm:py-12 md:px-12 md:py-16">
        <div className="max-w-3xl">
          <h2 className={typography.h2}>{cta.title}</h2>

          {cta.text1 ? (
            <p className="mt-4 text-sm leading-6 text-white/80 sm:mt-6 sm:text-base sm:leading-7">
              {cta.text1}
            </p>
          ) : null}

          {cta.text2 ? (
            <p className="mt-3 text-sm leading-6 text-white/80 sm:mt-4 sm:text-base sm:leading-7">
              {cta.text2}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:gap-4">
            <ContactButton label={cta.primaryLabel} variant="teal" />

            <Link
              href="/contacts"
              className="inline-flex items-center justify-center rounded-xl border border-white px-6 py-4 text-sm font-medium text-white transition-colors duration-200 hover:bg-white hover:text-[var(--color-navy)]"
            >
              {cta.secondaryLabel}
            </Link>
          </div>
        </div>
      </div>
    </Section>
  );
}