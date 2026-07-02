import Link from "next/link";
import { Section } from "@/components/layout/section";
import { getCtaContent } from "@/lib/homepage";

export async function CtaSection() {
  const cta = await getCtaContent();

  return (
    <Section className="py-20 md:py-28">
      <div className="rounded-[32px] bg-[var(--color-navy)] px-6 py-12 text-white md:px-12 md:py-16">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-semibold leading-tight md:text-4xl">
            {cta.title}
          </h2>

          {cta.text1 ? (
            <p className="mt-6 text-base leading-7 text-white/80">{cta.text1}</p>
          ) : null}

          {cta.text2 ? (
            <p className="mt-4 text-base leading-7 text-white/80">{cta.text2}</p>
          ) : null}

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/contacts"
              className="inline-flex items-center justify-center rounded-xl bg-[var(--color-teal)] px-6 py-4 text-sm font-medium text-white transition-colors duration-200 hover:bg-[var(--color-teal-hover)]"
            >
              {cta.primaryLabel}
            </Link>

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