import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { getAllCases } from "@/lib/cases";
import { getDirectionLabelMap } from "@/lib/directions-db";
import { getSectionHeadingContent } from "@/lib/homepage";
import { CasesCarousel } from "@/components/cases/cases-carousel";

export async function CasesPreview() {
  const previewCases = (await getAllCases()).slice(0, 9);
  const dirLabel = await getDirectionLabelMap();
  const heading = await getSectionHeadingContent("cases");

  return (
    <Section id="cases" className="py-20 md:py-28">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <SectionHeading
          eyebrow={heading.eyebrow}
          title={heading.title}
          description={heading.description}
        />

        <Button href="/cases" variant="secondary">
          Смотреть все случаи
        </Button>
      </div>

      {previewCases.length ? (
        <div className="mt-12">
          <CasesCarousel cases={previewCases} dirLabel={dirLabel} />
        </div>
      ) : (
        <p className="mt-10 text-sm text-[var(--color-gray-500)]">
          Пока нет опубликованных случаев.
        </p>
      )}
    </Section>
  );
}