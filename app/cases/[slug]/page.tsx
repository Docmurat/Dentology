import Image from "next/image";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { casesData } from "@/lib/cases-data";
import { teamData } from "@/lib/team-data";

type CaseDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function CaseDetailPage({
  params,
}: CaseDetailPageProps) {
  const { slug } = await params;

  const item = casesData.find((caseItem) => caseItem.slug === slug);

  if (!item) {
    notFound();
  }

  const caseDoctor =
    "doctorSlug" in item && item.doctorSlug
      ? teamData.find((doctor) => doctor.slug === item.doctorSlug)
      : null;

  return (
    <SiteShell>
      <PageHero
        eyebrow="Клинический случай"
        title={item.title}
        description={item.excerpt}
      />

      <Section className="pb-20 md:pb-28">
        <div className="grid gap-8">
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="rounded-full bg-[var(--color-gray-100)] px-3 py-1 text-[var(--color-navy)]">
              {item.category}
            </span>

            {item.status ? (
              <span className="rounded-full bg-[var(--color-navy)] px-3 py-1 text-white">
                {item.status}
              </span>
            ) : null}
          </div>

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
                  <div className="aspect-[4/3]">
                    {item.imageBefore ? (
                      <Image
                        src={item.imageBefore}
                        alt="До лечения"
                        width={800}
                        height={600}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="border-t border-[var(--color-gray-200)] px-4 py-3">
                    <p className="text-sm font-medium text-[var(--color-navy)]">
                      До лечения
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl bg-[var(--color-gray-100)]">
                  <div className="aspect-[4/3]">
                    {item.imageAfter ? (
                      <Image
                        src={item.imageAfter}
                        alt="После лечения"
                        width={800}
                        height={600}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="border-t border-[var(--color-gray-200)] px-4 py-3">
                    <p className="text-sm font-medium text-[var(--color-navy)]">
                      После лечения
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ) : null}

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

          {caseDoctor ? (
            <Card className="overflow-hidden p-0">
              <div className="grid md:grid-cols-[0.34fr_0.66fr]">
                <div className="bg-[var(--color-gray-100)]">
                  <Image
                    src={caseDoctor.image}
                    alt={caseDoctor.name}
                    width={800}
                    height={900}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="p-6 md:p-8">
                  <p className="text-sm uppercase tracking-[0.14em] text-[var(--color-teal)]">
                    Врач, ведущий случай
                  </p>

                  <h2 className="mt-3 text-2xl font-semibold text-[var(--color-navy)]">
                    {caseDoctor.name}
                  </h2>

                  <p className="mt-3 text-sm font-medium text-[var(--color-navy-secondary)]">
                    {caseDoctor.role}
                  </p>

                  <p className="mt-5 leading-7 text-[var(--color-gray-700)]">
                    {caseDoctor.description}
                  </p>
                </div>
              </div>
            </Card>
          ) : null}

          <Card>
            <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
              Клиническая ситуация
            </h2>

            <p className="mt-4 text-base leading-7 text-[var(--color-gray-700)]">
              {item.situation}
            </p>
          </Card>

          <Card>
            <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
              Диагностика
            </h2>

            <p className="mt-4 text-base leading-7 text-[var(--color-gray-700)]">
              {item.diagnostics}
            </p>
          </Card>

          <Card className="bg-[var(--color-gray-50)]">
            <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
              Принятое решение
            </h2>

            <p className="mt-4 text-base leading-7 text-[var(--color-gray-700)]">
              {item.decision}
            </p>
          </Card>

          <Card>
            <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
              Результат
            </h2>

            <p className="mt-4 text-base leading-7 text-[var(--color-gray-700)]">
              {item.result}
            </p>
          </Card>

          <Card className="bg-[var(--color-gray-50)]">
            <p className="text-base leading-7 text-[var(--color-navy)]">
              Данный случай демонстрирует важность точной диагностики,
              клинического мышления и корректно выбранной тактики лечения.
            </p>
          </Card>

          <div className="pt-4">
            <Button href="/contacts">Записаться на консультацию</Button>
          </div>
        </div>
      </Section>
    </SiteShell>
  );
}