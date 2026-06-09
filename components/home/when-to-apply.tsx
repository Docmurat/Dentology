import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card } from "@/components/ui/card";

const situations = [
  {
    title: "Рекомендовано удаление",
    text: "Вам уже предложили удалить зуб, но вы хотите рассмотреть возможность его сохранения.",
  },
  {
    title: "Боль после лечения",
    text: "После лечения корневых каналов боль сохраняется или возвращается.",
  },
  {
    title: "Хроническое воспаление",
    text: "Воспаление не проходит длительное время или периодически обостряется.",
  },
  {
    title: "Сложный случай",
    text: "Ранее вам говорили, что случай сложный или отказывались от лечения.",
  },
];

export function WhenToApply() {
  return (
    <Section id="when-to-apply" className="py-20 md:py-28">
      <SectionHeading
        eyebrow="Когда стоит обратиться"
        title="Ситуации, с которыми чаще всего приходят пациенты"
        description="Большинство обращений связано с уже существующими проблемами после лечения или сложными клиническими случаями."
      />

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {situations.map((item) => (
          <Card key={item.title} className="p-6">
            <h3 className="text-lg font-semibold text-[var(--color-navy)]">
              {item.title}
            </h3>

            <p className="mt-3 text-sm leading-6 text-[var(--color-gray-700)]">
              {item.text}
            </p>
          </Card>
        ))}
      </div>
    </Section>
  );
}