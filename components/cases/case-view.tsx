import Image from "next/image";
import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { CaseContentBlocks } from "@/components/cases/case-content-blocks";
import { BeforeAfter } from "@/components/cases/before-after";
import { ContactButton } from "@/components/contact/contact-modal";
import type { CaseItem } from "@/lib/cases-data";
import type { TeamMember } from "@/lib/team-data";

// Узкая карточка врача: фото, ФИО, должность, ссылка.
// На телефоне — круглый аватар слева и текст справа, чтобы карточка
// не занимала пол-экрана. От 1024px — прежний вид с крупным фото.
function CaseDoctorCard({
  doctor,
  quote,
}: {
  doctor: TeamMember;
  quote?: string | null;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center gap-4 p-4 lg:block lg:p-0">
        <div className="shrink-0 lg:shrink lg:bg-[var(--color-gray-100)]">
          <div className="aspect-square w-16 overflow-hidden rounded-full lg:aspect-[4/5] lg:w-full lg:rounded-none">
            <Image
              src={doctor.image}
              alt={doctor.name}
              width={600}
              height={750}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="min-w-0 lg:p-5">
          <h2 className="text-base font-semibold leading-snug text-[var(--color-navy)] lg:text-xl lg:leading-tight">
            {doctor.name}
          </h2>
          <p className="mt-1 text-xs font-medium text-[var(--color-navy-secondary)] lg:mt-2 lg:text-sm">
            {doctor.position}
          </p>
          <Link
            href={`/team/${doctor.slug}`}
            className="mt-2 inline-flex text-[10px] uppercase tracking-[0.12em] text-[var(--color-teal)] hover:text-[var(--color-navy)] lg:mt-3 lg:text-xs lg:tracking-[0.14em]"
          >
            Подробнее о враче
          </Link>
        </div>
      </div>

      {/* До 1024px цитата врача живёт внутри этой же карточки.
          Оформление прежнее — кавычка и бирюзовая полоса слева. */}
      {quote ? (
        <div className="border-t border-[var(--color-gray-200)] px-4 py-4 sm:px-5 sm:py-5 lg:hidden">
          <figure className="min-w-0 border-l-2 border-[var(--color-teal)] pl-4">
            <span
              aria-hidden="true"
              className="block font-serif text-5xl leading-none text-[var(--color-gray-200)]"
            >
              “
            </span>
            <blockquote className="mt-1 whitespace-pre-line break-words font-serif text-base italic leading-7 text-[var(--color-navy)]">
              {quote}
            </blockquote>
          </figure>
        </div>
      ) : null}
    </Card>
  );
}

// Полная вёрстка страницы кейса. Используется и публичной страницей,
// и админским предпросмотром (одинаковый вид «как на сайте»).
export function CaseView({
  item,
  doctor,
}: {
  item: CaseItem;
  doctor: TeamMember | null;
}) {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Клинический случай"
        title={item.title}
        description={item.excerpt}
      />

      <Section>
        <div className="grid gap-8 [&>*]:min-w-0">
          {item.imageBefore || item.imageAfter ? (
            <Card>
              <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
                Визуальная динамика
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-gray-600)]">
                Сравнение клинической ситуации до лечения и после проведения
                лечения.
              </p>

              <BeforeAfter before={item.imageBefore} after={item.imageAfter} />
            </Card>
          ) : null}

          <div
            className={
              doctor
                ? "grid min-w-0 gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start [&>*]:min-w-0"
                : "grid min-w-0 gap-8 [&>*]:min-w-0"
            }
          >
            {doctor ? (
              <aside className="lg:sticky lg:top-24 lg:self-start">
                <CaseDoctorCard doctor={doctor} quote={item.doctorWords} />
              </aside>
            ) : null}

            <div className="space-y-10">
              {item.doctorWords ? (
                <figure className="hidden min-w-0 border-l-2 border-[var(--color-teal)] pl-4 sm:pl-6 lg:block">
                  <span
                    aria-hidden="true"
                    className="block font-serif text-5xl leading-none text-[var(--color-gray-200)]"
                  >
                    “
                  </span>
                  <blockquote className="mt-1 whitespace-pre-line break-words font-serif text-base italic leading-7 text-[var(--color-navy)] sm:text-lg sm:leading-8 lg:text-xl">
                    {item.doctorWords}
                  </blockquote>
                </figure>
              ) : null}

              <CaseContentBlocks blocks={item.contentBlocks ?? []} />

              <div className="rounded-[28px] bg-[var(--color-navy)] px-6 py-10 text-white md:px-10 md:py-12">
                <h2 className="text-2xl font-semibold leading-tight md:text-3xl">
                  Запись на консультацию
                </h2>
                <p className="mt-4 leading-7 text-white/80">
                  Консультация позволяет оценить клиническую ситуацию и
                  определить возможные варианты лечения.
                </p>
                <div className="mt-8">
                  <ContactButton
                    label="Записаться на консультацию"
                    variant="teal"
                    context={`Клинический случай: ${item.title}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </SiteShell>
  );
}