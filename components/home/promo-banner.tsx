import Link from "next/link";
import { Section } from "@/components/layout/section";
import { getPromoContent } from "@/lib/homepage";
import { typography } from "@/lib/typography";

export async function PromoBanner() {
  const promo = await getPromoContent();

  const isExternal = /^https?:\/\//i.test(promo.linkHref);
  const showLink = Boolean(promo.linkHref && promo.linkLabel);

  return (
    // Отступ сверху совпадает с отступом Hero снизу от плашки
    // (pt-6 / md:pt-8) — так зазоры над и под плашкой выглядят одинаково.
    <Section className="pt-6 pb-0 md:pt-8 md:pb-0">
      <div className="rounded-[24px] border border-red-200 bg-red-50 px-6 py-3 text-center md:px-8">
        {promo.eyebrow ? (
          <p className={`${typography.eyebrow} font-semibold text-red-600`}>
            {promo.eyebrow}
          </p>
        ) : null}

        <p className={`mt-1 ${typography.bodyLg} text-[var(--color-navy)]`}>
          {promo.text}
          {showLink ? (
            isExternal ? (
              <a
                href={promo.linkHref}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 inline items-center font-medium text-red-700 hover:text-red-800"
              >
                {promo.linkLabel} →
              </a>
            ) : (
              <Link
                href={promo.linkHref}
                className="ml-2 inline items-center font-medium text-red-700 hover:text-red-800"
              >
                {promo.linkLabel} →
              </Link>
            )
          ) : null}
        </p>
      </div>
    </Section>
  );
}