import Link from "next/link";
import { Card } from "@/components/ui/card";
import { MemberPhoto } from "@/components/team/member-photo";
import type { TeamMember } from "@/lib/team-data";

const FALLBACK_QUOTE =
  "Команда — это не набор специалистов, а единая система клинического мышления. Мы растим врачей вокруг точной диагностики, ответственности за результат и уважения к зубу пациента.";

export function TeamChiefHero({ chief }: { chief: TeamMember }) {
  const quote = chief.quote?.trim() || FALLBACK_QUOTE;

  return (
    <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
      {/* На планшете mini (768–1023px) фото и текст встают в две колонки,
          а цитата уходит под них на всю ширину. На телефоне и десктопе
          раскладка прежняя. */}
      <div className="md:grid md:grid-cols-[300px_1fr] md:gap-8 lg:contents">
        <Card className="overflow-hidden p-0">
          <MemberPhoto src={chief.image} name={chief.name} priority />
        </Card>

        <div className="mt-8 min-w-0 md:mt-0 lg:mt-0">
          <p className="text-sm uppercase tracking-[0.14em] text-[var(--color-teal)]">
            Главный врач
          </p>

          <h2 className="mt-2 text-2xl font-semibold text-[var(--color-navy)] md:text-3xl">
            {chief.name}
          </h2>

          <p className="mt-2 text-sm font-medium text-[var(--color-navy-secondary)]">
            {chief.role || chief.position}
          </p>

          {chief.description ? (
            <p className="mt-5 whitespace-pre-line text-base leading-7 text-[var(--color-gray-700)]">
              {chief.description}
            </p>
          ) : null}

          {/* Ссылка на планшете mini — сразу под описанием в правой колонке */}
          <Link
            href={`/team/${chief.slug}`}
            className="mt-8 hidden text-xs uppercase tracking-[0.14em] text-[var(--color-teal)] hover:text-[var(--color-navy)] md:inline-flex lg:hidden"
          >
            Подробнее о враче
          </Link>

          {/* Цитата: на планшете mini выносится ниже, на остальных размерах
              остаётся в правой колонке рядом с описанием. */}
          <div className="md:hidden lg:block">
            <figure className="mt-8 border-l-2 border-[var(--color-teal)] pl-6">
              <span
                aria-hidden="true"
                className="block font-serif text-5xl leading-none text-[var(--color-gray-200)]"
              >
                “
              </span>
              <blockquote className="mt-1 whitespace-pre-line font-serif text-xl italic leading-8 text-[var(--color-navy)]">
                {quote}
              </blockquote>
            </figure>

            <Link
              href={`/team/${chief.slug}`}
              className="mt-8 inline-flex text-xs uppercase tracking-[0.14em] text-[var(--color-teal)] hover:text-[var(--color-navy)]"
            >
              Подробнее о враче
            </Link>
          </div>
        </div>
      </div>

      {/* Та же цитата — только для планшета mini, на всю ширину под колонками */}
      <div className="hidden md:block lg:hidden">
        <figure className="mt-8 border-l-2 border-[var(--color-teal)] pl-6">
          <span
            aria-hidden="true"
            className="block font-serif text-5xl leading-none text-[var(--color-gray-200)]"
          >
            “
          </span>
          <blockquote className="mt-1 whitespace-pre-line font-serif text-lg italic leading-8 text-[var(--color-navy)]">
            {quote}
          </blockquote>
        </figure>
      </div>
    </div>
  );
}