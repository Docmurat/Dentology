import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CtaSection } from "@/components/home/cta-section";
import { getCaseBySlug, getCaseSlugs } from "@/lib/cases";
import { teamData } from "@/lib/team-data";

// Новые кейсы появляются без пересборки (ISR).
export const revalidate = 60;

type CaseDetailPageProps = {
  params: Promise<{ slug: string }>;
};

type Doctor = (typeof teamData)[number];

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

function CaseDoctorCard({
  doctor,
  compact = false,
}: {
  doctor: Doctor;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <Card>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-[var(--color-gray-100)]">
            <Image
              src={doctor.image}
              alt={doctor.name}
              width={64}
              height={64}
              className="h-full w-full object-cover"
            />
          </div>

          <div>
            <p className="text-sm uppercase tracking-[0.14em] text-[var(--color-teal)]">
              {doctor.position}
            </p>
            <p className="mt-1 text-base font-semibold text-[var(--color-navy)]">
              {doctor.name}
            </p>
          </div>
        </div>

        <p className="mt-4 text-base leading-7 text-[var(--color-gray-700)]">
          {doctor.description}
        </p>

        <Button href="/contacts" className="mt-5 w-full justify-center">
          Записаться на консультацию
        </Button>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="bg-[var(--color-gray-100)]">
        <div className="aspect-[4/5]">
          <Image
            src={doctor.image}
            alt={doctor.name}
            width={700}
            height={875}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      <div className="p-6">
        <p className="text-sm uppercase tracking-[0.14em] text-[var(--color-teal)]">
          {doctor.position}
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-[var(--color-navy)]">
          {doctor.name}
        </h2>
        <p className="mt-4 text-base leading-7 text-[var(--color-gray-700)]">
          {doctor.description}
        </p>

        <Button href="/contacts" className="mt-6 w-full justify-center">
          Записаться на консультацию
        </Button>
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
    ? teamData.find((doctor) => doctor.slug === item.doctorSlug)
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
          {item.imageBefore || item.imageAfter ? (
            <Card>
              <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
                Визуальная динамика
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-gray-600)]">
                Сравнение клинической ситуации до лечения и после проведения
                лечения.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="overflow-hidden rounded-2xl bg-[var(--color-gray-100)]">
  {item.imageBefore ? (
    <Image
      src={item.imageBefore}
      alt="До лечения"
      width={800}
      height={600}
      className="block w-full h-auto"
    />
  ) : null}
  <div className="border-t border-[var(--color-gray-200)] px-4 py-3">
    <p className="text-sm font-medium text-[var(--color-navy)]">
      До лечения
    </p>
  </div>
</div>

                <div className="overflow-hidden rounded-2xl bg-[var(--color-gray-100)]">
  {item.imageAfter ? (
    <Image
      src={item.imageAfter}
      alt="После лечения"
      width={800}
      height={600}
      className="block w-full h-auto"
    />
  ) : null}
  <div className="border-t border-[var(--color-gray-200)] px-4 py-3">
    <p className="text-sm font-medium text-[var(--color-navy)]">
      После лечения
    </p>
  </div>
</div>
              </div>
            </Card>
          ) : null}

          <div className="grid gap-8 lg:grid-cols-[1.24fr_0.76fr] lg:items-start">
            <div className="grid gap-8">
              <Card>
                <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
                  Клиническая ситуация
                </h2>
                <p className="mt-4 whitespace-pre-line text-base leading-7 text-[var(--color-gray-700)]">
                  {item.situation}
                </p>
              </Card>

              {item.diagnostics ? (
                <Card>
                  <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
                    Диагностика
                  </h2>
                  <p className="mt-4 whitespace-pre-line text-base leading-7 text-[var(--color-gray-700)]">
                    {item.diagnostics}
                  </p>
                </Card>
              ) : null}

              {item.decision ? (
                <Card className="bg-[var(--color-gray-50)]">
                  <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
                    Принятое решение
                  </h2>
                  <p className="mt-4 whitespace-pre-line text-base leading-7 text-[var(--color-gray-700)]">
                    {item.decision}
                  </p>
                </Card>
              ) : null}

              {item.result ? (
                <Card>
                  <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
                    Результат
                  </h2>
                  <p className="mt-4 whitespace-pre-line text-base leading-7 text-[var(--color-gray-700)]">
                    {item.result}
                  </p>
                </Card>
              ) : null}

              {caseDoctor ? (
                <div className="lg:hidden">
                  <CaseDoctorCard doctor={caseDoctor} compact />
                </div>
              ) : null}
            </div>

            {caseDoctor ? (
              <aside className="hidden lg:block">
                <div className="sticky top-24">
                  <CaseDoctorCard doctor={caseDoctor} />
                </div>
              </aside>
            ) : null}
          </div>

          {item.protocolImages?.length ? (
            <Card>
              <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
                Фото этапов и протокола
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {item.protocolImages.map((image, index) => (
                  <div
                    key={image}
                    className="overflow-hidden rounded-2xl bg-[var(--color-gray-100)]"
                  >
                    <div className="aspect-[4/3]">
                      <Image
                        src={image}
                        alt={`Этап лечения ${index + 1}`}
                        width={700}
                        height={500}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      </Section>

      <CtaSection />
    </SiteShell>
  );
}
