import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { getAllCases } from "@/lib/cases";
import { getDirectionLabelMap } from "@/lib/directions-db";
import { CasesCarousel } from "@/components/cases/cases-carousel";

export async function CasesPreview() {
  const previewCases = (await getAllCases()).slice(0, 9);
  const dirLabel = await getDirectionLabelMap();

  return (
    <Section id="cases" className="py-20 md:py-28">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <SectionHeading
          eyebrow="Клинические случаи"
          title="Реальные ситуации, в которых решение требует больше, чем стандартного подхода"
          description="Кейсы, где ранее рекомендовали удаление, отказывали в лечении или не удавалось добиться стабильного результата."
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