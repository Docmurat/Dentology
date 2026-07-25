// components/education/course-view.tsx
import Image from "next/image";
import Link from "next/link";
import { Section } from "@/components/layout/section";
import { SiteShell } from "@/components/layout/site-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FaqSection } from "@/components/ui/faq-section";
import { JsonLd, courseJsonLd } from "@/components/seo/json-ld";
import { ContactButton } from "@/components/contact/contact-modal";
import { CaseCard } from "@/components/cases/case-card";
import {
  CourseStats,
  CourseEffectiveness,
} from "@/components/education/course-stats";
import { CourseQuote } from "@/components/education/course-quote";
import { CourseProgram } from "@/components/education/course-program";
import { CourseStickyCta } from "@/components/education/course-sticky-cta";
import { CourseReviews } from "@/components/reviews/course-reviews";
import { getCasesForCards } from "@/lib/cases";
import { getDirectionLabelMap } from "@/lib/directions-db";
import { getTeamMemberBySlug } from "@/lib/team";
import type { Course } from "@/lib/courses";

/**
 * Вид страницы курса «как на сайте».
 * Используется публичной страницей (ISR) и предпросмотром черновика
 * (динамический маршрут с проверкой прав) — как CaseView у кейсов.
 */
export async function CourseView({
  course,
  isDraftPreview = false,
  draftBackHref = "/admin/education",
}: {
  course: Course;
  isDraftPreview?: boolean;
  draftBackHref?: string;
}) {
  const doctor = course.doctorSlug
    ? await getTeamMemberBySlug(course.doctorSlug)
    : null;
  const photo = doctor?.image || null;

  // Блоки «Для кого» / «Что получите»: из полей курса (построчно).
  const toLines = (text: string) =>
    text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  const audienceTitle = course.audienceTitle || "Для кого этот курс";
  const outcomesTitle = course.outcomesTitle || "Что вы получите";
  const audienceItems = toLines(course.audienceText);
  const outcomesItems = toLines(course.outcomesText);
  const showAudienceBlock = course.showAudience && audienceItems.length > 0;
  const showOutcomesBlock = course.showOutcomes && outcomesItems.length > 0;
  const showEffectivenessBlock =
    course.showEffectiveness && course.effectivenessPercent > 0;
  const faqItems = course.faq;
  const programItems = course.program;
  const formatCards = course.formats
    .filter((f) => f.enabled)
    .map((f) => ({
      title: f.type,
      summary: f.summary,
      points: f.points,
      duration: f.duration,
      price: f.price,
      priceNote: f.priceNote,
      ctaLabel: f.ctaLabel,
      recommended: f.recommended,
    }));

  // Ширина карточек форматов зависит от их количества — иначе на 1024px
  // три фиксированные карточки не помещаются в ряд и последняя уходит вниз.
  const formatGridCols =
    formatCards.length === 1
      ? "mx-auto max-w-[420px]"
      : formatCards.length === 2
        ? "mx-auto max-w-[760px] sm:grid-cols-2"
        : formatCards.length === 3
          ? "sm:grid-cols-2 lg:grid-cols-3"
          : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  // Общие классы списков «Для кого» / «Что вы получите».
  // На планшете мини кегль возвращается к мобильному: две колонки по ~330px,
  // 16px в них выглядят крупно и раздувают высоту блока.
  const listTitleCls =
    "text-xl font-semibold leading-snug text-[var(--color-navy)] sm:text-2xl sm:leading-tight md:text-lg md:leading-snug lg:text-2xl lg:leading-tight";
  const listItemCls =
    "flex gap-3 text-sm leading-6 text-[var(--color-gray-700)] sm:text-base sm:leading-7 md:gap-2.5 md:text-sm md:leading-6 lg:gap-3 lg:text-base lg:leading-7";
  const listDotCls =
    "mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-gold)] md:mt-[9px] md:h-1 md:w-1 lg:mt-2 lg:h-1.5 lg:w-1.5";

  // Кейсы ведущего по направлениям курса. Фильтр и лимит — в SQL.
  const showCases = Boolean(doctor && course.directionSlugs.length);
  let courseCases: Awaited<ReturnType<typeof getCasesForCards>> = [];
  let dirLabel: Record<string, string> = {};
  if (showCases && course.doctorSlug) {
    const [cases, labels] = await Promise.all([
      getCasesForCards({
        doctorSlug: course.doctorSlug,
        directionSlugs: course.directionSlugs,
        limit: 4,
      }),
      getDirectionLabelMap(),
    ]);
    courseCases = cases;
    dirLabel = labels;
  }

  // Раскладка как на странице направления: 3 кейса на телефоне и десктопе,
  // 4 на планшете. Остальные — по кнопке на /cases с фильтром.
  const relatedCases = courseCases.slice(0, 3);
  const tabletCases = courseCases.slice(0, 4);

  return (
    <SiteShell>
      {/* Структурированные данные — только для опубликованного курса,
          черновик в индекс попадать не должен. */}
      {!isDraftPreview ? (
        <JsonLd
          data={courseJsonLd({
            title: course.title,
            slug: course.slug,
            description: course.description || undefined,
            image: course.quoteImage || undefined,
            instructorName: doctor?.name ?? null,
            instructorSlug: course.doctorSlug,
            formats: formatCards.map((f) => ({
              type: f.title,
              price: f.price,
            })),
          })}
        />
      ) : null}

      {isDraftPreview ? (
        <div className="flex items-center justify-between gap-4 bg-amber-100 px-4 py-2 text-sm text-amber-800">
          <span>Предпросмотр · черновик — так курс будет выглядеть на сайте</span>
          <Link href={draftBackHref} className="font-medium underline">
            ← к списку
          </Link>
        </div>
      ) : null}

      {/* Hero */}
      <Section className="pt-10 pb-12 md:pt-14 md:pb-16">
        <div className="grid items-center gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-10">
          <div className="order-1 lg:order-2">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-gold)]">
              Lucenta Обучение
            </p>

            {/*
              На 768–1023px колонка одна и 48px заголовка съедают полэкрана,
              на 1024px правая колонка ≈ 566px — там 36px читается лучше.
              Полный размер возвращаем только с 1280px.
            */}
            <h1 className="mt-4 text-2xl font-semibold leading-[1.15] text-[var(--color-navy)] sm:text-3xl sm:leading-[1.1] md:text-4xl lg:text-4xl xl:text-5xl">
              {course.title}
            </h1>

            {course.learningTypes?.length ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {course.learningTypes.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-[var(--color-gray-200)] bg-white px-3 py-1 text-xs font-medium text-[var(--color-navy)]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : null}

            {course.description ? (
              <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--color-gray-700)] sm:mt-5 sm:text-base sm:leading-7 lg:text-lg lg:leading-8 xl:max-w-2xl">
                {course.description}
              </p>
            ) : null}

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <ContactButton
                label="Оставить заявку"
                variant="ticket"
                context={`Курс «${course.title}»`}
                title="Заявка на курс"
              />
              <Button
                href={`/reviews?course=${course.slug}`}
                variant="gold-outline"
              >
                Отзывы
              </Button>
            </div>
          </div>

          {/*
            Телефон: круг по центру, подписи по центру.
            Планшет мини (768–1023): горизонтальная полоса — фото слева,
              имя и био справа по левому краю (иначе 40% ширины пустует).
            От 1024px: вертикальная колонка слева от текста.
          */}
          <div className="order-2 mx-auto w-full max-w-[380px] md:flex md:max-w-none md:items-center md:gap-6 lg:order-1 lg:mx-0 lg:block lg:max-w-[380px]">
            <div className="mx-auto w-full max-w-[180px] shrink-0 overflow-hidden rounded-full bg-[var(--color-gray-100)] sm:max-w-[240px] md:mx-0 md:w-[160px] lg:mx-auto lg:w-full lg:max-w-[300px]">
              <div className="relative aspect-square">
                {photo ? (
                  <Image
                    src={photo}
                    alt={doctor?.name || course.title}
                    fill
                    sizes="(max-width: 640px) 180px, (max-width: 1024px) 160px, 300px"
                    className="object-cover"
                  />
                ) : null}
              </div>
            </div>

            <div className="md:min-w-0 md:flex-1">
              {doctor ? (
                <p className="mt-4 text-center text-sm font-semibold text-[var(--color-navy)] sm:mt-5 sm:text-base md:mt-0 md:text-left lg:mt-5 lg:text-center">
                  Спикер — {doctor.name}
                </p>
              ) : null}
              {course.showBio && course.instructorBio ? (
                <p className="mt-2 text-center text-sm leading-6 text-[var(--color-gray-700)] sm:leading-7 md:text-left lg:text-center">
                  {course.instructorBio}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </Section>

      {/* Метрика (под фото, над «Для кого») */}
      {course.showMetrics && course.metrics.length ? (
        <Section className="pt-0 pb-4 md:pb-6">
          <CourseStats metrics={course.metrics} />
        </Section>
      ) : null}

      {/* Для кого + Результат */}
      {showAudienceBlock || showOutcomesBlock ? (
        <Section className="py-12 md:py-14 lg:py-16">
          <div
            className={`grid items-start gap-6 lg:gap-8 ${
              showAudienceBlock && showOutcomesBlock
                ? "md:grid-cols-2 md:gap-5"
                : "mx-auto max-w-3xl"
            }`}
          >
            {showAudienceBlock ? (
              <Card>
                <h2 className={listTitleCls}>{audienceTitle}</h2>
                <ul className="mt-6 space-y-3 md:mt-4 md:space-y-2.5 lg:mt-6 lg:space-y-3">
                  {audienceItems.map((item) => (
                    <li key={item} className={listItemCls}>
                      <span className={listDotCls} />
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}

            {showOutcomesBlock ? (
              <Card>
                <h2 className={listTitleCls}>{outcomesTitle}</h2>
                <ul className="mt-6 space-y-3 md:mt-4 md:space-y-2.5 lg:mt-6 lg:space-y-3">
                  {outcomesItems.map((item) => (
                    <li key={item} className={listItemCls}>
                      <span className={listDotCls} />
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}
          </div>
        </Section>
      ) : null}

      {/* Эффективность — одна крупная цифра как якорь доверия */}
      {showEffectivenessBlock ? (
        <Section className="py-8 md:py-10 lg:py-12">
          <CourseEffectiveness
            percent={course.effectivenessPercent}
            text={course.effectivenessText}
          />
        </Section>
      ) : null}

      {/* Цитата спикера + фото 3:4 */}
      {course.showQuote && (course.quote || course.quoteImage) ? (
        <Section className="py-8 md:py-12">
          <div
            className={`grid items-center gap-6 sm:gap-8 md:gap-10 lg:gap-12 ${
              course.quote && course.quoteImage
                ? "md:grid-cols-[1.15fr_0.85fr]"
                : "mx-auto max-w-3xl"
            }`}
          >
            {course.quote ? (
              /* Телефон: портрет выше цитаты. От 768px — цитата слева, портрет справа */
              <div className="order-2 md:order-1">
                <CourseQuote quote={course.quote} author={doctor?.name} />
              </div>
            ) : null}
            {course.quoteImage ? (
              <div className="order-1 mx-auto w-full max-w-[260px] sm:max-w-[340px] md:order-2 md:ml-auto md:max-w-[260px] lg:max-w-[340px]">
                <div className="overflow-hidden rounded-[24px] bg-[var(--color-gray-100)]">
                  <div className="relative aspect-[3/4]">
                    <Image
                      src={course.quoteImage}
                      alt={doctor?.name || course.title}
                      fill
                      sizes="(max-width: 767px) 100vw, (max-width: 1023px) 260px, 340px"
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </Section>
      ) : null}

      {/* Программа */}
      {course.showProgram && programItems.length ? (
        <Section className="py-12 md:py-16">
          <h2 className="text-xl font-semibold leading-snug text-[var(--color-navy)] sm:text-2xl sm:leading-tight md:text-3xl">
            Программа курса
          </h2>
          <div className="mt-6 sm:mt-8">
            <CourseProgram modules={programItems} />
          </div>
        </Section>
      ) : null}

      {/* Форматы обучения */}
      {formatCards.length ? (
        <Section className="py-12 md:py-16">
          <h2 className="text-xl font-semibold leading-snug text-[var(--color-navy)] sm:text-2xl sm:leading-tight md:text-center md:text-3xl">
            Форматы обучения
          </h2>
          <div
            className={`mt-6 grid items-stretch gap-5 sm:mt-8 sm:gap-6 ${formatGridCols}`}
          >
            {formatCards.map((f) => {
              const highlight = f.recommended;
              return (
                <Card
                  key={f.title}
                  // На телефоне рекомендуемая карточка поднимается наверх,
                  // от 640px — порядок из админки.
                  className={`flex h-full w-full flex-col ${
                    highlight
                      ? "order-first !border-[var(--color-gold)] !bg-[var(--color-gold)]/10 sm:order-none"
                      : ""
                  }`}
                >
                  <h3 className="text-base font-semibold leading-snug text-[var(--color-navy)] sm:text-lg">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-gray-700)]">
                    {f.summary}
                  </p>

                  {/* flex-1 прижимает цену и кнопку к низу — кнопки всех
                      карточек встают на одну линию */}
                  <ul className="mt-4 flex-1 space-y-2">
                    {f.points.map((p) => (
                      <li
                        key={p}
                        className="flex gap-2 text-sm leading-6 text-[var(--color-gray-700)]"
                      >
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--color-gold)]" />
                        {p}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 border-t border-[var(--color-gray-200)] pt-4">
                    <p className="text-xs text-[var(--color-gray-500)]">
                      {f.duration}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-[var(--color-navy)] sm:text-xl">
                      {f.price}
                    </p>
                    {f.priceNote ? (
                      <p className="mt-2 text-xs leading-5 text-[var(--color-gray-600)]">
                        {f.priceNote}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-5">
                    <ContactButton
                      label={f.ctaLabel}
                      variant={highlight ? "gold" : "gold-outline"}
                      context={`Курс «${course.title}» — ${f.title}`}
                      title="Заявка на курс"
                      className="w-full"
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        </Section>
      ) : null}

      {/* FAQ — общий компонент, он же отдаёт разметку FAQPage */}
      {course.showFaq && faqItems.length ? (
        <Section className="py-12 md:py-16">
          <FaqSection
            items={faqItems.map((f) => ({ question: f.q, answer: f.a }))}
            headingClassName="text-xl font-semibold leading-snug text-[var(--color-navy)] sm:text-2xl sm:leading-tight md:text-3xl"
            withJsonLd={!isDraftPreview}
          />
        </Section>
      ) : null}

      {/* Клинические случаи ведущего по направлениям курса */}
      {showCases && courseCases.length ? (
        <Section className="py-12 md:py-16">
          {/* В один ряд только с 1024px — на планшете мини заголовок и кнопка
              в строку не помещаются */}
          <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-gold)]">
                Клинические случаи
              </p>
              <h2 className="mt-3 text-xl font-semibold leading-snug text-[var(--color-navy)] sm:text-2xl sm:leading-tight md:text-3xl">
                Клинические случаи спикера
              </h2>
            </div>

            <div className="shrink-0 [&>*]:w-full sm:[&>*]:w-auto">
              <Button
                href={`/cases?doctor=${course.doctorSlug}&direction=${course.directionSlugs.join(",")}`}
                variant="gold-outline"
              >
                Смотреть все случаи
              </Button>
            </div>
          </div>

          {/* Телефон: три кейса в один столбец */}
          <div className="mt-8 grid gap-4 sm:hidden">
            {relatedCases.map((item) => (
              <CaseCard key={item.slug} item={item} dirLabel={dirLabel} />
            ))}
          </div>

          {/* Планшет: четыре кейса в две колонки */}
          <div className="mt-8 hidden gap-6 sm:grid sm:grid-cols-2 lg:hidden">
            {tabletCases.map((item) => (
              <CaseCard key={item.slug} item={item} dirLabel={dirLabel} />
            ))}
          </div>

          {/* Десктоп: три кейса в ряд */}
          <div className="mt-8 hidden gap-6 lg:grid lg:grid-cols-3">
            {relatedCases.map((item) => (
              <CaseCard key={item.slug} item={item} dirLabel={dirLabel} />
            ))}
          </div>
        </Section>
      ) : null}

      {/* Отзывы участников курса */}
      <CourseReviews courseSlug={course.slug} />

      {/* Финальный CTA */}
      <Section className="pb-20 pt-4 md:pb-28">
        <div
          id="course-final-cta"
          className="rounded-[24px] bg-[var(--color-gold)]/10 px-5 py-10 text-center sm:rounded-[32px] sm:px-8 sm:py-12 md:px-12 xl:py-16"
        >
          <h2 className="text-xl font-semibold leading-snug text-[var(--color-navy)] sm:text-2xl sm:leading-tight md:text-3xl">
            Готовы начать?
          </h2>
          {course.showCta && course.ctaNote ? (
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--color-gray-700)] sm:text-base sm:leading-7 xl:max-w-2xl">
              {course.ctaNote}
            </p>
          ) : null}
          <div className="mt-7 flex justify-center sm:mt-8">
            <ContactButton
              label="Оставить заявку"
              variant="gold"
              context={`Курс «${course.title}»`}
              title="Заявка на курс"
              className="w-full sm:w-auto"
            />
          </div>
        </div>
      </Section>

      <CourseStickyCta courseTitle={course.title} />
    </SiteShell>
  );
}