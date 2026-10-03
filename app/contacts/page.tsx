import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import type { Metadata } from "next";
import { ContactForm } from "@/components/forms/contact-form";
import { COMPANY } from "@/lib/company";
import { MessengerButtons } from "@/components/contact/messenger-buttons";
import { typography } from "@/lib/typography";
import { ConsultationInfo } from "@/components/consultation/consultation-info";
import { getConsultationContent } from "@/lib/homepage";
import { XRAY_UPLOAD_ENABLED } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Контакты",
  description:
    "Контакты Lucenta в Москве: телефон, адрес у метро Автозаводская, запись на консультацию. Можно прислать снимок для предварительной оценки.",
  alternates: { canonical: "/contacts" },
  openGraph: {
    title: "Контакты Lucenta",
    description:
      "Телефон, адрес и запись на консультацию. Можно прислать снимок для предварительной оценки.",
    url: "/contacts",
  },
};

// Срок ответа, цена и шаги консультации редактируются в админке.
export const revalidate = 60;

export default async function ContactsPage() {
  const consultation = await getConsultationContent();
  const responseNote = consultation.responseNote.trim().replace(/\.+$/, "");

  return (
    <SiteShell>
      <PageHero
        eyebrow="Контакты"
        title="Запись на консультацию"
        description="Пришлите снимок или опишите ситуацию — подскажем, есть ли смысл в очной консультации и с чего начать."
      />

      <Section className="pb-20 md:pb-28">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <Card>
            <h2 className={`${typography.h3} text-[var(--color-navy)]`}>
              Контактная информация
            </h2>

            <div
              className={`mt-6 space-y-4 ${typography.body} text-[var(--color-gray-700)]`}
            >
              <p>
                {COMPANY.displayAddress}
                <br />
                <span className={`${typography.caption} text-[var(--color-gray-500)]`}>
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

            <div
              className={`mt-8 rounded-2xl bg-[var(--color-gray-50)] px-5 py-5 ${typography.bodySm} text-[var(--color-gray-700)]`}
            >
              Пациенты обращаются также из других регионов, когда требуется
              экспертная оценка сложного клинического случая.
            </div>
          </Card>

          <Card>
            <h2 className={`${typography.h3} text-[var(--color-navy)]`}>
              Запрос на консультацию
            </h2>

            <p className={`mt-4 ${typography.bodySm} text-[var(--color-gray-700)]`}>
              Опишите ситуацию
              {XRAY_UPLOAD_ENABLED ? " и прикрепите снимок, если он есть" : ""}.
              {responseNote ? ` ${responseNote}: ` : " Мы свяжемся с вами: "}
              скажем, нужна ли очная консультация, и предложим время.
            </p>

            <ContactForm />
          </Card>
        </div>

        <div className="mt-16 sm:mt-20">
          <h2 className={`${typography.h3} text-[var(--color-navy)]`}>
            {consultation.title}
          </h2>

          <div className="mt-6 sm:mt-8">
            {/* Кнопки нет: форма заявки на этой же странице, выше. */}
            <ConsultationInfo showButton={false} />
          </div>
        </div>
      </Section>
    </SiteShell>
  );
}