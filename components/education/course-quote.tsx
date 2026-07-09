/**
 * Блок цитаты спикера — минималистичный стиль «как в кейсах»:
 * слева тонкая полоса-акцент, сверху маленькая кавычка, текст курсивом.
 * В золотом акценте раздела обучения. Скрыт, если цитаты нет.
 */
export function CourseQuote({
  quote,
  author,
}: {
  quote: string;
  author?: string | null;
}) {
  if (!quote) return null;

  return (
    <figure className="border-l-2 border-[var(--color-gold)] py-2 pl-6 md:pl-8">
      <span
        aria-hidden
        className="block text-2xl leading-none text-[var(--color-gold)]"
      >
        “
      </span>
      <blockquote className="mt-3 max-w-3xl text-lg italic leading-8 text-[var(--color-gray-700)] md:text-xl md:leading-9">
        {quote}
      </blockquote>
      {author ? (
        <figcaption className="mt-4 text-sm font-medium not-italic text-[var(--color-navy)]">
          {author}
        </figcaption>
      ) : null}
    </figure>
  );
}