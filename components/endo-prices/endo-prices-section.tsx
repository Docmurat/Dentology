// components/endo-prices/endo-prices-section.tsx
import { EndoPricesInteractive } from "@/components/endo-prices/endo-prices-interactive";
import { SectionHeading } from "@/components/ui/section-heading";
import { getEndoPricesContent } from "@/lib/homepage";
import { typography } from "@/lib/typography";
import Link from "next/link";

/**
 * Этапы и стоимость лечения каналов. Данные — из админки
 * (блок «Этапы и стоимость лечения каналов» на странице «Главная»).
 *
 * variant="home" — заголовок как у остальных секций главной;
 * variant="page" — заголовок карточного уровня для страницы направления.
 */
export async function EndoPricesContentBlock({
  variant,
}: {
  variant: "home" | "page";
}) {
  const content = await getEndoPricesContent();

  return (
    <div>
      {variant === "home" ? (
        <SectionHeading
          eyebrow={content.eyebrow}
          title={content.title}
          description={content.description}
        />
      ) : (
        <div className="max-w-3xl">
          <h2 className={`${typography.h3} text-[var(--color-navy)]`}>{content.title}</h2>
          {content.description ? (
            <p className={`mt-2 sm:mt-3 ${typography.body} text-[var(--color-gray-700)]`}>
              {content.description}
            </p>
          ) : null}
        </div>
      )}

      <div className="mt-8 sm:mt-10">
        <EndoPricesInteractive content={content} />
      </div>

      <p className={`mt-4 ${typography.bodySm} text-[var(--color-gray-600)]`}>
        Цены на другие услуги — реставрацию, протезирование, имплантацию,
        гигиену —{" "}
        <Link
          href="/prices"
          className="font-medium text-[var(--color-teal)] underline underline-offset-2 hover:text-[var(--color-navy)]"
        >
          на странице «Цены»
        </Link>
        .
      </p>
    </div>
  );
}
