import { truncate } from "@/lib/truncate";

// Описание на карточке кейса: максимум 300 символов и «подробнее…».
export function CaseExcerpt({ text }: { text: string }) {
  const { text: shown, truncated } = truncate(text, 150);

  return (
    <p className="mt-3 flex-1 text-sm leading-6 text-[var(--color-gray-700)]">
      {shown}
      {truncated ? (
        <>
          {"… "}
          <span className="font-medium text-[var(--color-teal)] transition group-hover:text-[var(--color-navy)]">
            Читать дальше
          </span>
        </>
      ) : null}
    </p>
  );
}