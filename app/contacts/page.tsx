import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import type { Metadata } from "next";
import { ContactForm } from "@/components/forms/contact-form";
import { COMPANY } from "@/lib/company";
import { MessengerButtons } from "@/components/contact/messenger-buttons";

export const metadata: Metadata = {
  title: "Контакты",
  description:
    "Контакты Lucenta и запись на консультацию по сложным клиническим случаям, эндодонтии и комплексному лечению.",
};

export default function ContactsPage() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Контакты"
        title="Запись на консультацию"
        description="Консультация проводится после анализа клинической ситуации и диагностики. Возможность лечения определяется индивидуально."
      />

      <Section className="pb-20 md:pb-28">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <Card>
            <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
              Контактная информация
            </h2>

            <div className="mt-6 space-y-4 text-base leading-7 text-[var(--color-gray-700)]">
              <p>
                {COMPANY.displayAddress}
                <br />
                <span className="text-sm text-[var(--color-gray-500)]">
                  {COMPANY.metro}
                </span>
              </p>
              <p>
                Телефон:{" "}
                <a
                  href={`tel:${COMPANY.phone.replace(/[^\d+]/g, "")}`}
                  className="text-[var(--color-teal)] hover:text-[var(--color-navy)]"
                >
                  {COMPANY.phone}
                </a>
              </p>
              <p>
                Email:{" "}
                <a
                  href={`mailto:${COMPANY.email}`}
                  className="text-[var(--color-teal)] hover:text-[var(--color-navy)]"
                >
                  {COMPANY.email}
                </a>
              </p>
            </div>

            <MessengerButtons />

            <div className="mt-8 rounded-2xl bg-[var(--color-gray-50)] px-5 py-5 text-sm leading-6 text-[var(--color-gray-700)]">
              Пациенты обращаются также из других регионов, когда требуется
              экспертная оценка сложного клинического случая.
            </div>
          </Card>

          <Card>
            <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
              Запрос на консультацию
            </h2>

            <p className="mt-4 text-sm leading-7 text-[var(--color-gray-700)]">
              Вы можете оставить запрос, кратко описав ситуацию. После этого с
              вами свяжутся для уточнения деталей и оптимального формата
              консультации.
            </p>

            <ContactForm />
          </Card>
        </div>
      </Section>
    </SiteShell>
  );
}