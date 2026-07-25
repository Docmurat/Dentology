"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { typography } from "@/lib/typography";
import type { ReviewItem } from "@/lib/reviews-data";

type ReviewCardProps = {
  review: ReviewItem;
  compact?: boolean;
  date?: string;
};

const MAX_PREVIEW_LENGTH = 220;

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

type SectionTone = "pos" | "neg" | "neutral";

function toLines(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function ReviewSection({
  title,
  text,
  tone,
}: {
  title: string;
  text: string;
  tone: SectionTone;
}) {
  const dot =
    tone === "pos"
      ? "bg-green-500"
      : tone === "neg"
        ? "bg-red-500"
        : "bg-[var(--color-gold)]";

  const items = toLines(text);
  if (!items.length) return null;

  return (
    <div className="mt-4">
      {/* Вес medium, а не semibold: это подпись к списку, капитель с
          разрядкой и так выделяет её из текста. */}
      <p
        className={`${typography.eyebrow} font-medium text-[var(--color-gray-500)]`}
      >
        {title}
      </p>
      <ul className="mt-2 space-y-1.5">
        {items.map((item, i) => (
          <li
            key={i}
            className={`flex gap-2 ${typography.bodySm} text-[var(--color-gray-700)]`}
          >
            <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase() || "—";
}

export function ReviewCard({ review, compact = false, date }: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isLong = review.text.length > MAX_PREVIEW_LENGTH;

  const visibleText = useMemo(() => {
    if (!isLong) return review.text;
    if (expanded) return review.text;
    return `${review.text.slice(0, MAX_PREVIEW_LENGTH).trim()}…`;
  }, [expanded, isLong, review.text]);

  return (
    <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5">
      <div className="flex items-center gap-4">
        {!imageError && review.image ? (
          <div className="h-14 w-14 overflow-hidden rounded-full bg-[var(--color-gray-100)]">
            <Image
              src={review.image}
              alt={review.author}
              width={80}
              height={80}
              className="h-full w-full object-cover"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-gray-100)] ${typography.bodySm} font-semibold text-[var(--color-navy-secondary)]`}
          >
            {getInitials(review.author)}
          </div>
        )}

        <div className="min-w-0">
          {/* Имя отделено от текста отзыва кеглем и цветом, а не весом.
              Сайт набран Arial: у него только Regular и Bold, промежуточных
              начертаний нет — font-medium там отображается как обычный, а
              font-semibold сразу как жирный. Когда вернётся переменный
              шрифт с настоящей осью веса, здесь уместнее bodySm + medium. */}
          <p className={`${typography.body} text-[var(--color-navy)]`}>
            {review.author}
          </p>

          {date ? (
            <p className={`${typography.caption} text-[var(--color-gray-500)]`}>
              {date}
            </p>
          ) : review.city ? (
            <p className={`${typography.caption} text-[var(--color-gray-500)]`}>
              {review.city}
            </p>
          ) : null}
        </div>
      </div>

      <p className={`mt-5 ${typography.bodySm} text-[var(--color-gray-700)]`}>
        {visibleText}
      </p>

      {review.pros ? (
        <ReviewSection title="Плюсы" text={review.pros} tone="pos" />
      ) : null}
      {review.cons ? (
        <ReviewSection title="Минусы" text={review.cons} tone="neg" />
      ) : null}
      {review.wishes ? (
        <ReviewSection title="Что бы я добавил" text={review.wishes} tone="neutral" />
      ) : null}

      <div className="mt-5 flex items-center justify-between gap-4">
        {isLong || compact ? (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className={`inline-flex ${typography.bodySm} font-medium text-[var(--color-navy-secondary)] hover:text-[var(--color-navy)]`}
          >
            {expanded ? "Свернуть" : "Читать полностью"}
          </button>
        ) : (
          <span />
        )}

        {review.instagramUrl ? (
          <a
            href={review.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 w-10 items-center justify-center text-[var(--color-teal)] transition hover:text-[var(--color-teal-hover)]"
            aria-label="Instagram"
            title="Instagram"
          >
            <InstagramIcon />
          </a>
        ) : null}
      </div>
    </div>
  );
}