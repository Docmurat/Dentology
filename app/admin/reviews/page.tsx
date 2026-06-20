import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getTeamMembers } from "@/lib/team";
import { ReviewImageField } from "@/components/admin/review-image-field";
import {
  approveReview,
  rejectReview,
  unpublishReview,
  deleteReview,
  setReviewVerified,
} from "./actions";

export const dynamic = "force-dynamic";

const DIRECTIONS = [
  { slug: "endodontics", label: "Эндодонтия" },
  { slug: "implantation", label: "Имплантация" },
  { slug: "gnathology", label: "Гнатология" },
  { slug: "prosthetics", label: "Ортопедия" },
  { slug: "restoration", label: "Реставрация" },
];

type Row = {
  id: string;
  author: string;
  text: string;
  image: string | null;
  doctor_slug: string | null;
  direction_slug: string | null;
  instagram: string | null;
  review_date: string | null;
  status: "pending" | "approved" | "rejected";
  verified: boolean;
  created_at: string;
};

function fmtDate(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("ru-RU");
}

function VerifiedToggle({ row }: { row: Row }) {
  return (
    <form action={setReviewVerified}>
      <input type="hidden" name="id" value={row.id} />
      <input
        type="hidden"
        name="verified"
        value={row.verified ? "false" : "true"}
      />
      <button
        className={
          row.verified
            ? "rounded-lg bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-200"
            : "rounded-lg border border-[var(--color-gray-200)] px-3 py-1.5 text-sm text-[var(--color-navy)] hover:bg-[var(--color-gray-50)]"
        }
      >
        {row.verified ? "✓ Проверенный" : "Отметить проверенным"}
      </button>
    </form>
  );
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

function Card({
  row,
  phone,
  doctorName,
  children,
}: {
  row: Row;
  phone: string | null;
  doctorName: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-[var(--color-navy)]">{row.author}</p>
          <p className="text-xs text-[var(--color-gray-500)]">
            {doctorName ? `Врач: ${doctorName} · ` : ""}
            {fmtDate(row.review_date ?? row.created_at)}
          </p>
        </div>
        {row.verified ? (
          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
            проверенный
          </span>
        ) : null}
      </div>

      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[var(--color-gray-700)]">
        {row.text}
      </p>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[var(--color-gray-500)]">
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

      <div className="mt-4">
        <ReviewImageField id={row.id} current={row.image} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

export default async function AdminReviewsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("reviews")
    .select(
      "id, author, text, image, doctor_slug, direction_slug, review_date, instagram, status, verified, created_at"
    )
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as Row[];

  const team = await getTeamMembers();
  const doctorName = new Map(team.map((d) => [d.slug, d.name]));
  const nameOf = (slug: string | null) =>
    slug ? doctorName.get(slug) ?? null : null;

  const { data: contacts } = await supabase
    .from("review_contacts")
    .select("review_id, phone");
  const phoneById = new Map(
    (contacts ?? []).map((c) => [c.review_id as string, c.phone as string])
  );

  const pending = rows.filter((r) => r.status === "pending");
  const approved = rows.filter((r) => r.status === "approved");
  const rejected = rows.filter((r) => r.status === "rejected");

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-semibold text-[var(--color-navy)]">Отзывы</h1>

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
              >
                <form action={approveReview} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={row.id} />
                  <select
                    name="directionSlug"
                    defaultValue={row.direction_slug ?? ""}
                    required
                    className="rounded-lg border border-[var(--color-gray-200)] px-2 py-1.5 text-sm outline-none focus:border-[var(--color-teal)]"
                  >
                    <option value="" disabled>
                      Направление…
                    </option>
                    {DIRECTIONS.map((d) => (
                      <option key={d.slug} value={d.slug}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                  <button className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700">
                    Опубликовать
                  </button>
                </form>
                <VerifiedToggle row={row} />
                <EditLink id={row.id} />
                <form action={rejectReview}>
                  <input type="hidden" name="id" value={row.id} />
                  <button className="text-sm text-[var(--color-gray-600)] hover:text-[var(--color-navy)]">
                    Отклонить
                  </button>
                </form>
                <form action={deleteReview}>
                  <input type="hidden" name="id" value={row.id} />
                  <button className="text-sm text-red-600 hover:text-red-700">
                    Удалить
                  </button>
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
              >
                <EditLink id={row.id} />
                <VerifiedToggle row={row} />
                <form action={unpublishReview}>
                  <input type="hidden" name="id" value={row.id} />
                  <button className="text-sm text-[var(--color-gray-600)] hover:text-[var(--color-navy)]">
                    Снять с публикации
                  </button>
                </form>
                <form action={deleteReview}>
                  <input type="hidden" name="id" value={row.id} />
                  <button className="text-sm text-red-600 hover:text-red-700">
                    Удалить
                  </button>
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
              >
                <EditLink id={row.id} />
                <form action={deleteReview}>
                  <input type="hidden" name="id" value={row.id} />
                  <button className="text-sm text-red-600 hover:text-red-700">
                    Удалить
                  </button>
                </form>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}