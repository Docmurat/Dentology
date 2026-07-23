import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCourseBySlug, getCourseBySlugAdmin } from "@/lib/courses";
import { getCurrentUser } from "@/lib/auth-guards";
import { getTeamMemberBySlug } from "@/lib/team";
import { CourseStats } from "@/components/education/course-stats";
import { CourseQuote } from "@/components/education/course-quote";
import { CourseReviews } from "@/components/reviews/course-reviews";
import { getAllCases } from "@/lib/cases";
import { getDirectionLabelMap } from "@/lib/directions-db";
import { CasesCarousel } from "@/components/cases/cases-carousel";
import { ContactButton } from "@/components/contact/contact-modal";

export const dynamic = "force-dynamic";

async function getViewer(): Promise<{
  userId: string | null;
  isStaff: boolean;
}> {
  const user = await getCurrentUser();
  if (!user) return { userId: null, isStaff: false };
  return {
    userId: user.id,
    isStaff: ["admin", "editor"].includes(user.role),
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) return { title: "Курс" };
  return {
    title: `${course.title} — Обучение`,
    description: course.description || undefined,
  };
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let course = await getCourseBySlug(slug);
  let isDraftPreview = false;
  let draftBackHref = "/admin/education";

  if (!course || !course.published) {
    // Черновик / недоступно публично — превью для staff или автора курса.
    const viewer = await getViewer();
    const draft = await getCourseBySlugAdmin(slug);
    if (!draft) notFound();
    const isAuthor =
      draft.createdBy !== null && draft.createdBy === viewer.userId;
    if (!viewer.isStaff && !isAuthor) notFound();
    course = draft;
    isDraftPreview = !course.published;
    draftBackHref = viewer.isStaff ? "/admin/education" : "/doctor/courses";
  }

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

  // Кейсы: только ведущего врача и по выбранным в настройках курса направлениям.
  const showCases = Boolean(doctor && course.directionSlugs.length);
  let courseCases: Awaited<ReturnType<typeof getAllCases>> = [];
  let dirLabel: Record<string, string> = {};
  if (showCases) {
    const [allCases, labels] = await Promise.all([
      getAllCases(),
      getDirectionLabelMap(),
    ]);
    const dirSet = new Set(course.directionSlugs);
    courseCases = allCases
      .filter(
        (c) =>
          c.doctorSlug === course.doctorSlug &&
          c.directionSlug &&
          dirSet.has(c.directionSlug)
      )
      .slice(0, 9);
    dirLabel = labels;
  }

  return (
    <SiteShell>
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
        <div className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="order-1 lg:order-2">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-gold)]">
              Lucenta Обучение
            </p>

            <h1 className="mt-4 text-3xl font-semibold leading-[1.1] text-[var(--color-navy)] md:text-5xl">
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
              <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--color-gray-700)]">
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

          <div className="order-2 mx-auto w-full max-w-[380px] lg:order-1 lg:mx-0">
            <div className="mx-auto w-full max-w-[300px] overflow-hidden rounded-full bg-[var(--color-gray-100)]">
              <div className="relative aspect-square">
                {photo ? (
                  <Image
                    src={photo}
                    alt={doctor?.name || course.title}
                    fill
                    sizes="(max-width: 1024px) 300px, 300px"
                    className="object-cover"
                    priority
                  />
                ) : null}
              </div>
            </div>
            {doctor ? (
              <p className="mt-5 text-center text-base font-semibold text-[var(--color-navy)]">
                Спикер — {doctor.name}
              </p>
            ) : null}
            {course.showBio && course.instructorBio ? (
              <p className="mt-2 text-center text-sm leading-7 text-[var(--color-gray-700)]">
                {course.instructorBio}
              </p>
            ) : null}
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
        <Section className="py-12 md:py-16">
          <div
            className={`grid items-start gap-6 ${
              showAudienceBlock && showOutcomesBlock ? "lg:grid-cols-2" : ""
            }`}
          >
            {showAudienceBlock ? (
              <Card>
                <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
                  {audienceTitle}
                </h2>
                <ul className="mt-6 space-y-3">
                  {audienceItems.map((item) => (
                    <li
                      key={item}
                      className="flex gap-3 text-base leading-7 text-[var(--color-gray-700)]"
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-gold)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}

            {showOutcomesBlock ? (
              <Card>
                <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
                  {outcomesTitle}
                </h2>
                <ul className="mt-6 space-y-3">
                  {outcomesItems.map((item) => (
                    <li
                      key={item}
                      className="flex gap-3 text-base leading-7 text-[var(--color-gray-700)]"
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-gold)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}
          </div>
        </Section>
      ) : null}

      {/* Цитата спикера + фото 3:4 (под метрикой) */}
      {course.showQuote && (course.quote || course.quoteImage) ? (
        <Section className="py-8 md:py-12">
          <div
            className={`grid items-center gap-8 md:gap-12 ${
              course.quote && course.quoteImage ? "lg:grid-cols-2" : ""
            }`}
          >
            {course.quote ? (
              <div>
                <CourseQuote quote={course.quote} author={doctor?.name} />
              </div>
            ) : null}
            {course.quoteImage ? (
              <div className="mx-auto w-full max-w-[340px] lg:ml-auto">
                <div className="overflow-hidden rounded-[24px] bg-[var(--color-gray-100)]">
                  <div className="relative aspect-[3/4]">
                    <Image
                      src={course.quoteImage}
                      alt={doctor?.name || course.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 340px"
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
          <h2 className="text-2xl font-semibold text-[var(--color-navy)] md:text-3xl">
            Программа курса
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {programItems.map((mod, i) => (
              <div
                key={mod.title}
                className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-gold)]/10 text-xs font-semibold text-[var(--color-gold)]">
                    {i + 1}
                  </span>
                  <h3 className="font-semibold text-[var(--color-navy)]">
                    {mod.title}
                  </h3>
                </div>
                <ul className="mt-3 space-y-2 pl-9">
                  {mod.items.map((item) => (
                    <li
                      key={item}
                      className="flex gap-2 text-sm leading-6 text-[var(--color-gray-700)]"
                    >
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--color-gold)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {/* Форматы обучения */}
      {formatCards.length ? (
        <Section className="py-12 md:py-16">
          <h2 className="text-center text-2xl font-semibold text-[var(--color-navy)] md:text-3xl">
            Форматы обучения
          </h2>
          <div className="mt-8 flex flex-wrap items-start justify-center gap-6">
          {formatCards.map((f) => {
            const highlight = f.recommended;
            return (
              <Card
                key={f.title}
                className={`flex w-full flex-col sm:w-[320px] ${
                  highlight
                    ? "!border-[var(--color-gold)] !bg-[var(--color-gold)]/10"
                    : ""
                }`}
              >
                <h3 className="text-lg font-semibold text-[var(--color-navy)]">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-gray-700)]">
                  {f.summary}
                </p>

                <ul className="mt-4 space-y-2">
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
                  <p className="mt-1 text-xl font-semibold text-[var(--color-navy)]">
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

      {/* FAQ */}
      {course.showFaq && faqItems.length ? (
        <Section className="py-12 md:py-16">
          <Card>
            <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
              Частые вопросы
            </h2>

            <div className="mt-6 space-y-4">
              {faqItems.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-2xl border border-[var(--color-gray-200)] bg-white px-5 py-4"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left">
                    <span className="text-base font-medium leading-7 text-[var(--color-navy)]">
                      {item.q}
                    </span>

                    <span className="shrink-0 text-[var(--color-gray-400)] transition group-open:rotate-45">
                      +
                    </span>
                  </summary>

                  <div className="pt-4">
                    <p className="leading-7 text-[var(--color-gray-700)]">
                      {item.a}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </Card>
        </Section>
      ) : null}

      {/* Клинические случаи ведущего по направлениям курса */}
      {showCases && courseCases.length ? (
        <Section className="py-12 md:py-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-gold)]">
                Клинические случаи
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--color-navy)] md:text-3xl">
                Клинические случаи спикера
              </h2>
            </div>
            <Button
              href={`/cases?doctor=${course.doctorSlug}&direction=${course.directionSlugs.join(",")}`}
              variant="gold-outline"
            >
              Смотреть все случаи
            </Button>
          </div>

          <div className="mt-10">
            <CasesCarousel cases={courseCases} dirLabel={dirLabel} />
          </div>
        </Section>
      ) : null}

      {/* Отзывы участников курса */}
      <CourseReviews courseSlug={course.slug} />

      {/* Финальный CTA */}
      <Section className="pb-28 pt-4 md:pb-28">
        <div className="rounded-[32px] bg-[var(--color-gold)]/10 px-6 py-12 text-center md:px-12">
          <h2 className="text-2xl font-semibold text-[var(--color-navy)] md:text-3xl">
            Готовы начать?
          </h2>
          {course.showCta && course.ctaNote ? (
            <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-[var(--color-gray-700)]">
              {course.ctaNote}
            </p>
          ) : null}
          <div className="mt-8 flex justify-center">
            <ContactButton
              label="Оставить заявку"
              variant="gold"
              context={`Курс «${course.title}»`}
              title="Заявка на курс"
            />
          </div>
        </div>
      </Section>

      {/* Липкая кнопка на мобильном */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-gray-200)] bg-white/95 p-3 backdrop-blur md:hidden">
        <ContactButton
          label="Оставить заявку"
          variant="gold"
          context={`Курс «${course.title}»`}
          title="Заявка на курс"
          className="w-full py-3"
        />
      </div>
    </SiteShell>
  );
}