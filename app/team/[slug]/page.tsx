import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContactButton } from "@/components/contact/contact-modal";
import { getTeamMemberBySlug } from "@/lib/team";
import { getAllCases } from "@/lib/cases";
import { getReviewsByDoctor } from "@/lib/reviews";
import { getDirections, getDirectionLabelMap } from "@/lib/directions-db";
import { directionLabel } from "@/lib/directions";
import { CaseExcerpt } from "@/components/cases/case-excerpt";
import { ReviewCard } from "@/components/reviews/review-card";
import { ReviewsCarousel } from "@/components/reviews/reviews-carousel";
import { DoctorDocuments } from "@/components/team/doctor-documents";

export const revalidate = 60;

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

const FOCUS_FALLBACK = [
  "Работа со сложными клиническими ситуациями",
  "Диагностика и выбор обоснованной тактики лечения",
  "Сохранение тканей и минимизация вмешательства",
  "Комплексное планирование лечения",
];

const VISIT_FALLBACK = [
  "Если требуется экспертное мнение по сложному случаю",
  "Если ранее предложенное решение вызывает сомнения",
  "Если лечение требует участия нескольких специалистов",
  "Если важно выбрать наиболее щадящую тактику",
];

export default async function DoctorPage({ params }: Props) {
  const { slug } = await params;

  const doctor = await getTeamMemberBySlug(slug);
  if (!doctor) {
    notFound();
  }

  const [allCases, doctorReviews, allDirections, dirLabel] = await Promise.all([
    getAllCases(),
    getReviewsByDoctor(doctor.slug),
    getDirections(),
    getDirectionLabelMap(),
  ]);

  const doctorCases = allCases.filter((item) => item.doctorSlug === doctor.slug);

  // Направления из профиля: чекбоксы «участвует» + направление-«ведущий».
  const profileDirectionSlugs = new Set([
    ...(doctor.directionSlugs ?? []),
    ...(doctor.leadDirectionSlug ? [doctor.leadDirectionSlug] : []),
  ]);
  const doctorDirections = allDirections.filter((direction) =>
    profileDirectionSlugs.has(direction.slug)
  );

  const stats = doctor.stats ?? [];
  const focusPoints = doctor.focusPoints?.length
    ? doctor.focusPoints
    : FOCUS_FALLBACK;
  const visitPoints = doctor.visitPoints?.length
    ? doctor.visitPoints
    : VISIT_FALLBACK;
  const courses = doctor.courses ?? [];

  return (
    <SiteShell>
      <Section className="pt-14 pb-16 md:pt-20 md:pb-24">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div className="order-2 lg:order-1">
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--color-teal)]">
              {doctor.featured ? "Ведущий специалист" : "Врач команды"}
            </p>

            <h1 className="mt-5 text-4xl font-semibold leading-[1.08] text-[var(--color-navy)] md:text-6xl">
              {doctor.name}
            </h1>

            <p className="mt-5 text-lg leading-8 text-[var(--color-navy-secondary)]">
              {doctor.role}
            </p>

            <p className="mt-6 max-w-2xl whitespace-pre-line text-base leading-7 text-[var(--color-gray-700)]">
              {doctor.description}
            </p>

            {doctorDirections.length ? (
              <div className="mt-8 flex flex-wrap gap-2">
                {doctorDirections.map((direction) => (
                  <div
                    key={direction.slug}
                    className="rounded-xl border border-[var(--color-gray-200)] bg-white px-3 py-1.5"
                  >
                    <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-navy)]">
                      {direction.title}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            {stats.length ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="rounded-2xl bg-[var(--color-teal)]/5 px-5 py-5"
                  >
                    <p className="text-3xl font-light leading-none text-[var(--color-teal)]">
                      {stat.value}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--color-gray-600)]">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-8">
              <ContactButton
                label="Записаться на консультацию"
                variant="teal"
                context={`Врач: ${doctor.name}`}
              />
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="mx-auto aspect-[3/4] w-full max-w-[420px] overflow-hidden rounded-[28px] bg-[var(--color-gray-100)]">
              {doctor.image ? (
                <Image
                  src={doctor.image}
                  alt={doctor.name}
                  width={900}
                  height={1200}
                  className="h-full w-full object-cover"
                  priority
                />
              ) : null}
            </div>
          </div>
        </div>
      </Section>

      {doctor.doctorQuote?.trim() ? (
        <Section className="pb-12 md:pb-16">
          <figure className="border-l-2 border-[var(--color-teal)] pl-6">
            <blockquote className="whitespace-pre-line font-serif text-xl italic leading-8 text-[var(--color-navy)]">
              {doctor.doctorQuote}
            </blockquote>
          </figure>
        </Section>
      ) : null}

      <Section className="pb-20 md:pb-28">
        <div className="grid gap-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <Card>
              <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
                Клинический фокус
              </h2>
              <ul className="mt-5 space-y-3 text-base leading-7 text-[var(--color-gray-700)]">
                {focusPoints.map((point) => (
                  <li key={point}>• {point}</li>
                ))}
              </ul>
            </Card>

            <Card className="bg-[var(--color-gray-50)]">
              <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
                Когда стоит обратиться
              </h2>
              <ul className="mt-5 space-y-3 text-base leading-7 text-[var(--color-gray-700)]">
                {visitPoints.map((point) => (
                  <li key={point}>• {point}</li>
                ))}
              </ul>
            </Card>
          </div>

          {doctorCases.length ? (
            <Card>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
                  Клинические случаи врача
                </h2>

                <Button
                  href={`/cases?doctor=${doctor.slug}`}
                  variant="secondary"
                >
                  Смотреть все случаи
                </Button>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-3">
                {doctorCases.slice(0, 3).map((item) => (
                  <Link
                    key={item.slug}
                    href={`/cases/${item.slug}`}
                    className="group block h-full"
                  >
                    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white p-5 transition group-hover:-translate-y-1 group-hover:shadow-lg">
                      <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl bg-[var(--color-gray-100)]">
                        {item.coverImage ? (
                          <Image
                            src={item.coverImage}
                            alt={item.title}
                            width={900}
                            height={600}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>

                      <p className="mt-5 text-xs uppercase tracking-[0.14em] text-[var(--color-gray-500)]">
                        {directionLabel(item.directionSlug, dirLabel)}
                      </p>

                      <h3 className="mt-2 text-lg font-semibold text-[var(--color-navy)]">
                        {item.title}
                      </h3>

                      <CaseExcerpt text={item.excerpt} />
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          ) : null}

          <DoctorDocuments
            initialBeside={courses.length >= 6}
            diploma={
              <Card>
                <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
                  Диплом специалиста
                </h2>

                {doctor.diplomaImage ? (
                  <div className="mt-5 overflow-hidden rounded-2xl bg-[var(--color-gray-100)]">
                    <Image
                      src={doctor.diplomaImage}
                      alt={`Диплом — ${doctor.name}`}
                      width={1000}
                      height={750}
                      className="h-auto w-full"
                    />
                  </div>
                ) : (
                  <p className="mt-4 text-base leading-7 text-[var(--color-gray-700)]">
                    Скан диплома появится после загрузки в админ-панели.
                  </p>
                )}
              </Card>
            }
            education={
              <Card>
                <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
                  Дополнительное образование
                </h2>

                {courses.length ? (
                  <ol className="mt-5 space-y-3 text-base leading-7 text-[var(--color-gray-700)]">
                    {courses.map((course, index) => (
                      <li key={index} className="flex gap-3">
                        <span className="font-medium text-[var(--color-teal)]">
                          {index + 1}.
                        </span>
                        <span>{course}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-4 text-base leading-7 text-[var(--color-gray-700)]">
                    Здесь можно разместить профильные курсы, обучение,
                    конференции и программы повышения квалификации врача.
                  </p>
                )}
              </Card>
            }
            reviewsBeside={
              doctorReviews.length ? (
                <div>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
                      Отзывы о враче
                    </h2>

                    <Button
                      href={`/reviews?doctor=${doctor.slug}`}
                      variant="secondary"
                    >
                      Смотреть все отзывы
                    </Button>
                  </div>

                  <div className="mt-6 grid gap-6">
                    {doctorReviews.slice(0, 3).map((review) => (
                      <ReviewCard
                        key={review.slug}
                        review={review}
                        date={review.date}
                      />
                    ))}
                  </div>
                </div>
              ) : null
            }
            reviewsWide={
              doctorReviews.length ? (
                <div>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
                      Отзывы о враче
                    </h2>

                    <Button
                      href={`/reviews?doctor=${doctor.slug}`}
                      variant="secondary"
                    >
                      Смотреть все отзывы
                    </Button>
                  </div>

                  <div className="mt-6">
                    <ReviewsCarousel reviews={doctorReviews.slice(0, 9)} />
                  </div>
                </div>
              ) : null
            }
          />

          <div className="rounded-[28px] bg-[var(--color-navy)] px-6 py-10 text-white md:px-10 md:py-12">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-semibold leading-tight md:text-4xl">
                Запись на консультацию
              </h2>

              <p className="mt-5 leading-7 text-white/80">
                Консультация помогает оценить клиническую ситуацию, определить
                возможные варианты лечения и выбрать обоснованную тактику.
              </p>

              <div className="mt-8">
                <ContactButton
                  label="Записаться на консультацию"
                  variant="teal"
                  context={`Врач: ${doctor.name}`}
                />
              </div>
            </div>
          </div>
        </div>
      </Section>
    </SiteShell>
  );
}