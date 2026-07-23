import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { directionLabel } from "@/lib/directions";
import { CaseExcerpt } from "@/components/cases/case-excerpt";
import type { CaseItem } from "@/lib/cases-data";

// Единая карточка клинического случая. Используется на /cases,
// на странице направления и везде, где нужен тот же вид.
export function CaseCard({
  item,
  dirLabel = {},
  doctorName,
}: {
  item: CaseItem;
  dirLabel?: Record<string, string>;
  doctorName?: string | null;
}) {
  return (
    <Link href={`/cases/${item.slug}`} className="group block h-full">
      <Card className="flex h-full flex-col overflow-hidden transition duration-200 group-hover:-translate-y-1 group-hover:shadow-lg">
        <div className="relative mb-5">
          <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl bg-[var(--color-gray-100)]">
            {item.coverImage ? (
              <Image
                src={item.coverImage}
                alt={item.title}
                width={1500}
                height={1000}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
        </div>

        <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-gray-500)]">
          {directionLabel(item.directionSlug, dirLabel)}
        </p>

        <h2 className="mt-2 text-lg font-semibold text-[var(--color-navy)]">
          {item.title}
        </h2>

        <CaseExcerpt text={item.excerpt} />

        {doctorName ? (
          <p className="mt-5 text-sm font-medium text-[var(--color-navy-secondary)]">
            {doctorName}
          </p>
        ) : null}
      </Card>
    </Link>
  );
}