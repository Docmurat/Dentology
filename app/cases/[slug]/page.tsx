import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CaseContentBlocks } from "@/components/cases/case-content-blocks";
import { BeforeAfter } from "@/components/cases/before-after";
import { getCaseBySlug, getCaseSlugs } from "@/lib/cases";
import { getTeamMemberBySlug } from "@/lib/team";
import type { TeamMember } from "@/lib/team-data";

// Новые кейсы появляются без пересборки (ISR).
export const revalidate = 60;

type CaseDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getCaseSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: CaseDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await getCaseBySlug(slug);
  if (!item) return {};
  return { title: item.title, description: item.excerpt };
}

// Узкая карточка врача: фото, должность, ФИО. Без описания и кнопки.
function CaseDoctorCard({ doctor }: { doctor: TeamMember }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="bg-[var(--color-gray-100)]">
        <div className="aspect-[4/5]">
          <Image
            src={doctor.image}
            alt={doctor.name}
            width={600}
            height={750}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      <div className="p-5">
        <h2 className="text-xl font-semibold text-[var(--color-navy)]">
          {doctor.name}
        </h2>
        <p className="mt-2 text-sm font-medium text-[var(--color-navy-secondary)]">
          {doctor.position}
        </p>
        <Link
          href={`/team/${doctor.slug}`}
          className="mt-3 inline-flex text-xs uppercase tracking-[0.14em] text-[var(--color-teal)] hover:text-[var(--color-navy)]"
        >
          Подробнее о враче
        </Link>
      </div>
    </Card>
  );
}

export default async function CaseDetailPage({ params }: CaseDetailPageProps) {
  const { slug } = await params;
  const item = await getCaseBySlug(slug);

  if (!item) {
    notFound();
  }

  const caseDoctor = item.doctorSlug
    ? await getTeamMemberBySlug(item.doctorSlug)
    : null;

  return (
    <SiteShell>
      <PageHero
        eyebrow="Клинический случай"
        title={item.title}
        description={item.excerpt}
      />

      <Section>
        <div className="grid gap-8">
          {/* Визуальная динамика — без изменений */}
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

          {/* Врач слева, описание справа */}
          <div
            className={
              caseDoctor
                ? "grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start"
                : "grid gap-8"
            }
          >
            {caseDoctor ? (
              <aside className="lg:sticky lg:top-24 lg:self-start">
                <CaseDoctorCard doctor={caseDoctor} />
              </aside>
            ) : null}

            <div className="space-y-10">
              {item.doctorWords ? (
                <figure className="border-l-2 border-[var(--color-teal)] pl-6">
                  <span
                    aria-hidden="true"
                    className="block font-serif text-5xl leading-none text-[var(--color-gray-200)]"
                  >
                    “
                  </span>
                  <blockquote className="mt-1 whitespace-pre-line font-serif text-xl italic leading-8 text-[var(--color-navy)]">
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
                  <Button href="/contacts">Записаться на консультацию</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </SiteShell>
  );
}