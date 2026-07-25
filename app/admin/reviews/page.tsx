// app/admin/reviews/page.tsx
import Link from "next/link";
import { query } from "@/lib/db";
import { getTeamMembers } from "@/lib/team";
import { getDirections } from "@/lib/directions-db";
import {
  approveReview,
  rejectReview,
  unpublishReview,
  deleteReview,
} from "./actions";
import { PageHeadingEditor } from "@/components/admin/page-heading-editor";
import { AdminThumb } from "@/components/admin/admin-thumb";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";

export const dynamic = "force-dynamic";

type DirectionOption = { slug: string; label: string };

type Row = {
  id: string;
  author: string;
  text: string;
  image: string | null;
  doctor_slug: string | null;
  direction_slugs: string[] | null;
  instagram: string | null;
  review_date: string | null;
  status: "pending" | "approved" | "rejected";
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
  const a = parts[0]?.[0] ?? "";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase() || "—";
}

function avatarSrc(row: Row): string | null {
  return row.image || null;
}

function EditLink({ id }: { id: string }) {
  return (
    <Link
      href={`/admin/reviews/${id}/edit`}
      className="text-sm font-medium text-[var(--color-navy)] hover:text-[var(--color-navy-secondary)]"
    >
      Изменить
    </Link>
  );
}

// Раздел курс-отзыва — серый подзаголовок + список строк с цветным маркером.
function toLines(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

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

function Card({
  row,
  phone,
  doctorName,
  dirLabel,
  children,
}: {
  row: Row;
  phone: string | null;
  doctorName: string | null;
  dirLabel: Record<string, string>;
  children: React.ReactNode;
}) {
  const dirs = row.direction_slugs ?? [];
  const avatar = avatarSrc(row);
  return (
    <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5">
      <div className="flex items-start gap-3">
        {avatar ? (
          <AdminThumb
            url={avatar}
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
          <p className="font-medium text-[var(--color-navy)]">{row.author}</p>
          <p className="text-xs text-[var(--color-gray-500)]">
            {doctorName ? `Врач: ${doctorName} · ` : ""}
            {fmtDate(row.review_date ?? row.created_at)}
          </p>
        </div>
      </div>

      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[var(--color-gray-700)]">
        {row.text}
      </p>

      {/* Разделы курс-отзыва — по мере заполнения */}
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

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[var(--color-gray-500)]">
        {row.course_slug ? (
          <span>
            Курс:{" "}
            <span className="text-[var(--color-navy)]">
              {row.course_title || row.course_slug}
            </span>
          </span>
        ) : dirs.length ? (
          <span>Направления: {dirs.map((d) => dirLabel[d] ?? d).join(", ")}</span>
        ) : null}
        {row.instagram ? (
          <a
            href={row.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-teal)] hover:underline"
          >
            Instagram
          </a>
        ) : null}
        {phone ? (
          <span>
            Телефон: <span className="text-[var(--color-navy)]">{phone}</span>{" "}
            (виден только администратору)
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

function ApproveForm({
  row,
  directions,
}: {
  row: Row;
  directions: DirectionOption[];
}) {
  // Курс-отзыв публикуется без направлений.
  if (row.course_slug) {
    return (
      <form action={approveReview} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={row.id} />
        <span className="rounded-full bg-[var(--color-gold)]/15 px-2 py-0.5 text-xs font-medium text-[var(--color-navy)]">
          Курс: {row.course_title || row.course_slug}
        </span>
        <button className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700">
          Опубликовать
        </button>
      </form>
    );
  }

  const checked = new Set(row.direction_slugs ?? []);
  return (
    <form action={approveReview} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={row.id} />
      <span className="text-xs text-[var(--color-gray-500)]">
        Направления (до 3):
      </span>
      {directions.map((d) => (
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
          {d.label}
        </label>
      ))}
      <button className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700">
        Опубликовать
      </button>
    </form>
  );
}

export default async function AdminReviewsPage() {
  const rows = await query<Row>(
    `select id, author, text, image, doctor_slug, direction_slugs, course_slug,
            course_title, pros, cons, wishes, instagram, review_date,
            sort_order, status, created_at
       from reviews order by created_at desc`
  );

  const team = await getTeamMembers();
  const doctorName = new Map(team.map((d) => [d.slug, d.name]));

  // Направления берём из базы, а не из фиксированного списка,
  // чтобы новые (например, ортодонтия) сразу были доступны при модерации.
  const allDirections = await getDirections();
  const directions: DirectionOption[] = allDirections.map((d) => ({
    slug: d.slug,
    label: d.title,
  }));
  const dirLabel: Record<string, string> = Object.fromEntries(
    allDirections.map((d) => [d.slug, d.title])
  );
  const nameOf = (slug: string | null) =>
    slug ? doctorName.get(slug) ?? null : null;

  const contacts = await query<{ review_id: string; phone: string | null }>(
    `select review_id, phone from review_contacts`
  );
  const phoneById = new Map(
    contacts.map((c) => [c.review_id, c.phone ?? ""])
  );

  const pending = rows.filter((r) => r.status === "pending");
  const approved = rows.filter((r) => r.status === "approved");
  const rejected = rows.filter((r) => r.status === "rejected");

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-semibold text-[var(--color-navy)]">Отзывы</h1>
      <PageHeadingEditor pageKey="reviews" />
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-amber-700">
            На модерации
          </h2>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            {pending.length}
          </span>
        </div>

        {pending.length ? (
          <div className="space-y-4">
            {pending.map((row) => (
              <Card
                key={row.id}
                row={row}
                phone={phoneById.get(row.id) ?? null}
                doctorName={nameOf(row.doctor_slug)}
                dirLabel={dirLabel}
              >
                <ApproveForm row={row} directions={directions} />
                <EditLink id={row.id} />
                <form action={rejectReview}>
                  <input type="hidden" name="id" value={row.id} />
                  <button className="text-sm text-[var(--color-gray-600)] hover:text-[var(--color-navy)]">
                    Отклонить
                  </button>
                </form>
                <form action={deleteReview}>
                  <input type="hidden" name="id" value={row.id} />
                  <ConfirmDeleteButton title={`отзыв — ${row.author}`} />
                </form>
              </Card>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-[var(--color-gray-200)] bg-white px-5 py-6 text-center text-sm text-[var(--color-gray-500)]">
            Новых отзывов на модерации нет.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-gray-500)]">
          Опубликованные ({approved.length})
        </h2>
        {approved.length ? (
          <div className="space-y-4">
            {approved.map((row) => (
              <Card
                key={row.id}
                row={row}
                phone={phoneById.get(row.id) ?? null}
                doctorName={nameOf(row.doctor_slug)}
                dirLabel={dirLabel}
              >
                <EditLink id={row.id} />
                <form action={unpublishReview}>
                  <input type="hidden" name="id" value={row.id} />
                  <button className="text-sm text-[var(--color-gray-600)] hover:text-[var(--color-navy)]">
                    Снять с публикации
                  </button>
                </form>
                <form action={deleteReview}>
                  <input type="hidden" name="id" value={row.id} />
                  <ConfirmDeleteButton title={`отзыв — ${row.author}`} />
                </form>
              </Card>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-[var(--color-gray-200)] bg-white px-5 py-6 text-center text-sm text-[var(--color-gray-500)]">
            Опубликованных отзывов пока нет.
          </p>
        )}
      </section>

      {rejected.length ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-gray-400)]">
            Отклонённые ({rejected.length})
          </h2>
          <div className="space-y-4">
            {rejected.map((row) => (
              <Card
                key={row.id}
                row={row}
                phone={phoneById.get(row.id) ?? null}
                doctorName={nameOf(row.doctor_slug)}
                dirLabel={dirLabel}
              >
                <EditLink id={row.id} />
                <form action={deleteReview}>
                  <input type="hidden" name="id" value={row.id} />
                  <ConfirmDeleteButton title={`отзыв — ${row.author}`} />
                </form>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}