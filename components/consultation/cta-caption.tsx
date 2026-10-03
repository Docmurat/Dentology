import { consultationCaption, getConsultationContent } from "@/lib/homepage";
import { typography } from "@/lib/typography";

/**
 * Строка под кнопкой записи: срок ответа, цена и длительность консультации.
 *
 * Значения берутся из блока «Как проходит консультация» в админке.
 * Не заполнено ничего — строка не выводится вовсе.
 */
export async function CtaCaption({
  inverted = false,
  className = "",
}: {
  /** На тёмной подложке. */
  inverted?: boolean;
  className?: string;
}) {
  const text = consultationCaption(await getConsultationContent());
  if (!text) return null;

  return (
    <p
      className={`${typography.caption} ${
        inverted ? "text-white/70" : "text-[var(--color-gray-500)]"
      } ${className}`}
    >
      {text}
    </p>
  );
}
