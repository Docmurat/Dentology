// components/home/cases-preview.tsx
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { getCasesForCards } from "@/lib/cases";
import { getDirectionLabelMap } from "@/lib/directions-db";
import { getSectionHeadingContent } from "@/lib/homepage";
import { CasesCarousel } from "@/components/cases/cases-carousel";
import { CaseCard } from "@/components/cases/case-card";

export async function CasesPreview() {
  // Девять кейсов нужны карусели на десктопе, до 1024px показываем четыре.
  // Читаем только поля карточки: раньше getAllCases() тянул content_blocks
  // и полный разбор по всем опубликованным кейсам.
  const [previewCases, dirLabel, heading] = await Promise.all([
    getCasesForCards({ limit: 9 }),
    getDirectionLabelMap(),
    getSectionHeadingContent("cases"),
  ]);

  // Карусель неудобна на сенсорных экранах: до 1024px показываем четыре
  // кейса списком — в один столбец на телефоне и в две колонки на планшете.
  const mobileCases = previewCases.slice(0, 4);

  return (
    <Section id="cases" className="pt-20 pb-12 md:pt-28 md:pb-16">
      <div className="flex flex-col gap-6 sm:gap-8 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          eyebrow={heading.eyebrow}
          title={heading.title}
          description={heading.description}
        />

        {/* shrink-0 — чтобы заголовок не сжимал кнопку и текст не переносился */}
        <div className="shrink-0">
          <Button href="/cases" variant="secondary">
            Смотреть все случаи
          </Button>
        </div>
      </div>

      {previewCases.length ? (
        <>
          {/* Телефон: четыре кейса в один столбец */}
          <div className="mt-8 grid gap-4 sm:hidden">
            {mobileCases.map((item) => (
              <CaseCard key={item.slug} item={item} dirLabel={dirLabel} />
            ))}
          </div>

          {/* Планшет: четыре кейса в две колонки */}
          <div className="mt-8 hidden gap-4 sm:grid sm:grid-cols-2 sm:gap-6 lg:hidden">
            {mobileCases.map((item) => (
              <CaseCard key={item.slug} item={item} dirLabel={dirLabel} />
            ))}
          </div>

          {/* Десктоп: карусель, как было */}
          <div className="mt-12 hidden lg:block">
            <CasesCarousel cases={previewCases} dirLabel={dirLabel} />
          </div>
        </>
      ) : (
        <p className="mt-10 text-sm text-[var(--color-gray-500)]">
          Пока нет опубликованных случаев.
        </p>
      )}
    </Section>
  );
}