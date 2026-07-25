// app/team/[slug]/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContactButton } from "@/components/contact/contact-modal";
import { getTeamMemberBySlug } from "@/lib/team";
import { getCasesForCards } from "@/lib/cases";
import { getReviewsByDoctor } from "@/lib/reviews";
import { getDirections, getDirectionLabelMap } from "@/lib/directions-db";
import { CaseCard } from "@/components/cases/case-card";
import { ReviewCard } from "@/components/reviews/review-card";
import { ReviewForm } from "@/components/reviews/review-form";
import { ReviewsCarousel } from "@/components/reviews/reviews-carousel";
import { DoctorDocuments } from "@/components/team/doctor-documents";
import { JsonLd, physicianJsonLd } from "@/components/seo/json-ld";
import { typography } from "@/lib/typography";

export const revalidate = 60;

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const doctor = await getTeamMemberBySlug(slug);
  if (!doctor) return {};

  const description = doctor.excerpt || doctor.description || undefined;
  const url = `/team/${slug}`;
  const images = doctor.image ? [{ url: doctor.image }] : undefined;

  return {
    title: doctor.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: doctor.name,
      description,
      url,
      type: "profile",
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: doctor.name,
      description,
      ...(doctor.image ? { images: [doctor.image] } : {}),
    },
  };
}

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

  // Кейсы врача: фильтр и лимит в SQL. Раньше здесь читались все
  // опубликованные кейсы целиком (вместе с content_blocks) и отсеивались в JS.
  // Больше четырёх ни одна раскладка не показывает.
  const [doctorCases, doctorReviews, allDirections, dirLabel] =
    await Promise.all([
      getCasesForCards({ doctorSlug: doctor.slug, limit: 4 }),
      getReviewsByDoctor(doctor.slug),
      getDirections(),
      getDirectionLabelMap(),
    ]);

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
    <>
      <JsonLd
        data={physicianJsonLd({
          name: doctor.name,
          slug: doctor.slug,
          position: doctor.position,
          description: doctor.excerpt || doctor.description || undefined,
          image: doctor.image || undefined,
        })}
      />
      <SiteShell>
      <Section className="pt-14 pb-16 md:pt-20 md:pb-24">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div className="order-2 lg:order-1">
            <p className={`${typography.eyebrow} text-[var(--color-teal)]`}>
              {doctor.featured ? "Ведущий специалист" : "Врач команды"}
            </p>

            <h1 className={`mt-4 md:mt-5 ${typography.h1} text-[var(--color-navy)]`}>
              {doctor.name}
            </h1>

            <p className="mt-3 text-sm leading-6 text-[var(--color-navy-secondary)] sm:mt-5 sm:text-lg sm:leading-8">
              {doctor.role}
            </p>

            <p className="mt-4 max-w-2xl whitespace-pre-line text-sm leading-6 text-[var(--color-gray-700)] sm:mt-6 sm:text-base sm:leading-7">
              {doctor.description}
            </p>

            {doctorDirections.length ? (
              <div className="mt-6 flex flex-wrap gap-1.5 sm:mt-8 sm:gap-2">
                {doctorDirections.map((direction) => (
                  <div
                    key={direction.slug}
                    className="rounded-lg border border-[var(--color-gray-200)] bg-white px-2 py-1 sm:rounded-xl sm:px-3 sm:py-1.5"
                  >
                    <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--color-navy)] sm:text-xs sm:tracking-[0.08em]">
                      {direction.title}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            {stats.length ? (
              <div className="mt-6 grid gap-2 sm:mt-8 sm:grid-cols-3 sm:gap-4">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="rounded-2xl bg-[var(--color-teal)]/5 px-4 py-3 sm:px-5 sm:py-5 sm:text-center lg:px-3 lg:py-4 xl:px-5 xl:py-5"
                  >
                    {/* Цифра показателя — не текст, а декоративная величина: её кегль
                        задаётся шириной бокса, поэтому она вне шкалы. */}
                    <p className="text-lg font-light leading-none text-[var(--color-teal)] sm:text-2xl lg:text-xl">
                      {stat.value}
                    </p>
                    <p className={`mt-1 sm:mt-2 ${typography.caption} text-[var(--color-gray-600)]`}>
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
            <blockquote className={`whitespace-pre-line ${typography.quote} text-[var(--color-navy)]`}>
              {doctor.doctorQuote}
            </blockquote>
          </figure>
        </Section>
      ) : null}

      <Section className="pb-20 md:pb-28">
        <div className="grid gap-6 sm:gap-8 [&>*]:min-w-0">
          <div className="grid min-w-0 gap-4 sm:gap-8 lg:grid-cols-2 [&>*]:min-w-0">
            <Card>
              <h2 className={`${typography.h3} text-[var(--color-navy)]`}>
                Клинический фокус
              </h2>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-[var(--color-gray-700)] sm:mt-5 sm:space-y-3 sm:text-base sm:leading-7">
                {focusPoints.map((point) => (
                  <li key={point}>• {point}</li>
                ))}
              </ul>
            </Card>

            <Card className="bg-[var(--color-gray-50)]">
              <h2 className={`${typography.h3} text-[var(--color-navy)]`}>
                Когда стоит обратиться
              </h2>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-[var(--color-gray-700)] sm:mt-5 sm:space-y-3 sm:text-base sm:leading-7">
                {visitPoints.map((point) => (
                  <li key={point}>• {point}</li>
                ))}
              </ul>
            </Card>
          </div>

          {doctorCases.length ? (
            /* Оформление как на странице направления: без внешнего контейнера,
               общая карточка кейса, разное количество под каждый экран. */
            <div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
                <h2 className={`${typography.h3} text-[var(--color-navy)]`}>
                  Клинические случаи врача
                </h2>

                <div className="shrink-0 [&>*]:w-full sm:[&>*]:w-auto">
                  <Button
                    href={`/cases?doctor=${doctor.slug}`}
                    variant="secondary"
                  >
                    Смотреть все случаи
                  </Button>
                </div>
              </div>

              {/* Телефон: три кейса в один столбец */}
              <div className="mt-8 grid gap-4 sm:hidden">
                {doctorCases.slice(0, 3).map((item) => (
                  <CaseCard key={item.slug} item={item} dirLabel={dirLabel} />
                ))}
              </div>

              {/* Планшет: четыре кейса в две колонки */}
              <div className="mt-8 hidden gap-6 sm:grid sm:grid-cols-2 lg:hidden">
                {doctorCases.slice(0, 4).map((item) => (
                  <CaseCard key={item.slug} item={item} dirLabel={dirLabel} />
                ))}
              </div>

              {/* Десктоп: три кейса в ряд */}
              <div className="mt-8 hidden gap-6 lg:grid lg:grid-cols-3">
                {doctorCases.slice(0, 3).map((item) => (
                  <CaseCard key={item.slug} item={item} dirLabel={dirLabel} />
                ))}
              </div>
            </div>
          ) : null}

          <DoctorDocuments
            initialBeside={courses.length >= 6}
            diplomaSrc={doctor.diplomaImage}
            diplomaAlt={`Диплом — ${doctor.name}`}
            education={
              <Card>
                <h2 className={`${typography.h3} text-[var(--color-navy)]`}>
                  Дополнительное образование
                </h2>

                {courses.length ? (
                  <ol className="mt-4 space-y-2 text-sm leading-6 text-[var(--color-gray-700)] sm:mt-5 sm:space-y-3 sm:text-base sm:leading-7">
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
                  <p className="mt-3 text-sm leading-6 text-[var(--color-gray-700)] sm:mt-4 sm:text-base sm:leading-7">
                    Здесь можно разместить профильные курсы, обучение,
                    конференции и программы повышения квалификации врача.
                  </p>
                )}
              </Card>
            }
            reviewsBeside={
              doctorReviews.length ? (
                <div>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:flex-col lg:items-end xl:flex-row xl:items-end">
                    <h2 className={`${typography.h3} text-[var(--color-navy)] lg:w-full xl:w-auto`}>
                      Отзывы о враче
                    </h2>

                    {/* Кнопки: на телефоне во всю ширину друг под другом,
                        от 640px — в ряд справа. На планшете Pro «Оставить
                        отзыв» уходит отдельной строкой под заголовок. */}
                    <div className="flex w-full shrink-0 flex-col gap-3 [&>*]:w-full sm:w-auto sm:flex-row sm:items-center sm:[&>*]:w-auto lg:w-full lg:[&>*]:flex-1 lg:[&>*]:w-auto xl:w-auto xl:[&>*]:flex-none">
                      <ReviewForm
                        doctors={[{ slug: doctor.slug, name: doctor.name }]}
                      />
                      <Button
                        href={`/reviews?doctor=${doctor.slug}`}
                        variant="secondary"
                      >
                        Смотреть все отзывы
                      </Button>
                    </div>
                  </div>

                  {/* Телефон: три отзыва в столбец */}
                  <div className="mt-6 grid gap-4 sm:hidden">
                    {doctorReviews.slice(0, 3).map((review) => (
                      <ReviewCard
                        key={review.slug}
                        review={review}
                        date={review.date}
                      />
                    ))}
                  </div>

                  {/* Планшет: четыре отзыва в две колонки */}
                  <div className="mt-6 hidden gap-6 sm:grid sm:grid-cols-2 lg:hidden">
                    {doctorReviews.slice(0, 4).map((review) => (
                      <ReviewCard
                        key={review.slug}
                        review={review}
                        date={review.date}
                      />
                    ))}
                  </div>

                  {/* Десктоп: три отзыва столбцом в узкой колонке */}
                  <div className="mt-6 hidden gap-6 lg:grid">
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
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:flex-col lg:items-end xl:flex-row xl:items-end">
                    <h2 className={`${typography.h3} text-[var(--color-navy)] lg:w-full xl:w-auto`}>
                      Отзывы о враче
                    </h2>

                    {/* Кнопки: на телефоне во всю ширину друг под другом,
                        от 640px — в ряд справа. На планшете Pro «Оставить
                        отзыв» уходит отдельной строкой под заголовок. */}
                    <div className="flex w-full shrink-0 flex-col gap-3 [&>*]:w-full sm:w-auto sm:flex-row sm:items-center sm:[&>*]:w-auto lg:w-full lg:[&>*]:flex-1 lg:[&>*]:w-auto xl:w-auto xl:[&>*]:flex-none">
                      <ReviewForm
                        doctors={[{ slug: doctor.slug, name: doctor.name }]}
                      />
                      <Button
                        href={`/reviews?doctor=${doctor.slug}`}
                        variant="secondary"
                      >
                        Смотреть все отзывы
                      </Button>
                    </div>
                  </div>

                  {/* Телефон: три отзыва в столбец */}
                  <div className="mt-6 grid gap-4 sm:hidden">
                    {doctorReviews.slice(0, 3).map((review) => (
                      <ReviewCard
                        key={review.slug}
                        review={review}
                        date={review.date}
                      />
                    ))}
                  </div>

                  {/* Планшет: четыре отзыва в две колонки */}
                  <div className="mt-6 hidden gap-6 sm:grid sm:grid-cols-2 lg:hidden">
                    {doctorReviews.slice(0, 4).map((review) => (
                      <ReviewCard
                        key={review.slug}
                        review={review}
                        date={review.date}
                      />
                    ))}
                  </div>

                  {/* Десктоп: карусель, как было */}
                  <div className="mt-6 hidden lg:block">
                    <ReviewsCarousel reviews={doctorReviews.slice(0, 9)} />
                  </div>
                </div>
              ) : null
            }
          />

          <div className="rounded-[28px] bg-[var(--color-navy)] px-6 py-10 text-white md:px-10 md:py-12">
            <div className="max-w-3xl">
              <h2 className={typography.h2}>
                Запись на консультацию
              </h2>

              <p className="mt-4 text-sm leading-6 text-white/80 sm:mt-5 sm:text-base sm:leading-7">
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
    </>
  );
}