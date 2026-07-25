// app/moderator/reviews/page.tsx
import Link from "next/link";
import { query } from "@/lib/db";
import { getDirections } from "@/lib/directions-db";
import { getTeamMembersAll } from "@/lib/team";
import { AdminThumb } from "@/components/admin/admin-thumb";
import { approveReview, rejectReview } from "@/app/admin/reviews/actions";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  author: string;
  text: string;
  image: string | null;
  doctor_slug: string | null;
  direction_slugs: string[] | null;
  instagram: string | null;
  review_date: string | null;
  created_at: string;
  course_slug: string | null;
  course_title: string | null;
  pros: string | null;
  cons: string | null;
  wishes: string | null;
};

function fmtDate(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("ru-RU");
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "—";
}

function toLines(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Раздел курс-отзыва: серый подзаголовок + список с цветным маркером.
function Section({
  title,
  text,
  dot,
}: {
  title: string;
  text: string;
  dot: string;
}) {
  const items = toLines(text);
  if (!items.length) return null;

  return (
    <div className="mt-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-gray-500)]">
        {title}
      </p>
      <ul className="mt-1.5 space-y-1">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex gap-2 text-sm leading-6 text-[var(--color-gray-700)]"
          >
            <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Очередь модерации: только отзывы со статусом pending.
 *
 * Опубликованные и отклонённые здесь не показываются — они уже
 * обработаны. Неопубликованный отзыв можно поправить и дополнить фото
 * перед публикацией; опубликованный правит сотрудник через админку.
 */
export default async function ModeratorReviewsPage() {
  const [rows, allDirections, team] = await Promise.all([
    query<Row>(
      `select id, author, text, image, doctor_slug, direction_slugs,
              course_slug, course_title, pros, cons, wishes,
              instagram, review_date, created_at
         from reviews where status = 'pending'
        order by created_at desc`
    ),
    getDirections(),
    getTeamMembersAll(),
  ]);

  const doctorName = new Map(team.map((d) => [d.slug, d.name]));
  const dirLabel: Record<string, string> = Object.fromEntries(
    allDirections.map((d) => [d.slug, d.title])
  );

  return (
    <div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
          Отзывы на модерации
        </h1>
        <p className="text-sm text-[var(--color-gray-600)]">
          Пациентский отзыв публикуется с указанием направлений, отзыв о курсе —
          без них. Перед публикацией текст можно поправить и добавить фото.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {rows.length ? (
          rows.map((row) => {
            const isCourse = Boolean(row.course_slug);
            const checked = new Set(row.direction_slugs ?? []);
            const doctor = row.doctor_slug
              ? doctorName.get(row.doctor_slug) ?? row.doctor_slug
              : null;

            return (
              <div
                key={row.id}
                className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5"
              >
                <div className="flex items-start gap-3">
                  {row.image ? (
                    <AdminThumb
                      url={row.image}
                      className="h-12 w-12"
                      sizes="48px"
                      rounded="rounded-full"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-gray-100)] text-xs font-semibold text-[var(--color-navy-secondary)]">
                      {getInitials(row.author)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--color-navy)]">
                      {row.author}
                    </p>
                    <p className="text-xs text-[var(--color-gray-500)]">
                      {doctor ? `Врач: ${doctor} · ` : ""}
                      {fmtDate(row.review_date ?? row.created_at)}
                    </p>
                  </div>
                </div>

                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[var(--color-gray-700)]">
                  {row.text}
                </p>

                {row.pros ? (
                  <Section title="Плюсы" text={row.pros} dot="bg-green-500" />
                ) : null}
                {row.cons ? (
                  <Section title="Минусы" text={row.cons} dot="bg-red-500" />
                ) : null}
                {row.wishes ? (
                  <Section
                    title="Что бы я добавил"
                    text={row.wishes}
                    dot="bg-[var(--color-gold)]"
                  />
                ) : null}

                {row.instagram ? (
                  <p className="mt-3 text-xs">
                    <a
                      href={row.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--color-teal)] hover:underline"
                    >
                      Instagram
                    </a>
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <form
                    action={approveReview}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <input type="hidden" name="id" value={row.id} />

                    {isCourse ? (
                      <span className="rounded-full bg-[var(--color-gold)]/15 px-2 py-0.5 text-xs font-medium text-[var(--color-navy)]">
                        Курс: {row.course_title || row.course_slug}
                      </span>
                    ) : (
                      <>
                        <span className="text-xs text-[var(--color-gray-500)]">
                          Направления (до 3):
                        </span>
                        {allDirections.map((d) => (
                          <label
                            key={d.slug}
                            className="inline-flex items-center gap-1 text-xs text-[var(--color-navy)]"
                          >
                            <input
                              type="checkbox"
                              name="directionSlug"
                              value={d.slug}
                              defaultChecked={checked.has(d.slug)}
                            />
                            {dirLabel[d.slug] ?? d.slug}
                          </label>
                        ))}
                      </>
                    )}

                    <button className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700">
                      Опубликовать
                    </button>
                  </form>

                  {/* Правка до публикации: текст, дата, фото. */}
                  <Link
                    href={`/moderator/reviews/${row.id}/edit`}
                    className="text-sm font-medium text-[var(--color-navy)] hover:text-[var(--color-navy-secondary)]"
                  >
                    Изменить
                  </Link>

                  <form action={rejectReview}>
                    <input type="hidden" name="id" value={row.id} />
                    <button className="text-sm text-[var(--color-gray-600)] hover:text-[var(--color-navy)]">
                      Отклонить
                    </button>
                  </form>
                </div>
              </div>
            );
          })
        ) : (
          <p className="rounded-2xl border border-[var(--color-gray-200)] bg-white px-5 py-8 text-center text-sm text-[var(--color-gray-500)]">
            Новых отзывов на модерации нет.
          </p>
        )}
      </div>
    </div>
  );
}