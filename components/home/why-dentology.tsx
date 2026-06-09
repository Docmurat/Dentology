import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  TeamIcon,
  MethodIcon,
  AcademicIcon,
  PracticeIcon,
} from "@/components/ui/icons";

const items = [
  {
    title: "Экспертная команда",
    text: "К лечению привлекаются специалисты в зависимости от клинической задачи и логики общего плана.",
    icon: TeamIcon,
  },
  {
    title: "Современные методики",
    text: "Решения принимаются на основе актуального клинического подхода, диагностики и точности исполнения.",
    icon: MethodIcon,
  },
  {
    title: "Академический подход",
    text: "Образовательное направление и работа с врачами усиливают уровень клинического мышления внутри практики.",
    icon: AcademicIcon,
  },
  {
    title: "Реальная практика",
    text: "Основа доверия — не рекламные обещания, а клинические случаи и ежедневная работа со сложными ситуациями.",
    icon: PracticeIcon,
  },
];

export function WhyDentology() {
  return (
    <Section className="py-20 md:py-28">
      <SectionHeading
        eyebrow="Почему Dentology"
        title="Основа подхода — точная диагностика, клиническое мышление и системное лечение"
      />

      <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.title} className="h-full">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-gray-200)] text-[var(--color-navy-secondary)]">
                <Icon className="h-6 w-6" />
              </div>

              <h3 className="text-lg font-semibold text-[var(--color-navy)]">
                {item.title}
              </h3>

              <p className="mt-4 text-sm leading-7 text-[var(--color-gray-700)]">
                {item.text}
              </p>
            </Card>
          );
        })}
      </div>
    </Section>
  );
}