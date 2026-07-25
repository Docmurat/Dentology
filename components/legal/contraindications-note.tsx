import { typography } from "@/lib/typography";

// Дисклеймер по ч. 7 ст. 24 ФЗ «О рекламе» — на страницах услуг/направлений.
export function ContraindicationsNote({
  className = "",
}: {
  className?: string;
}) {
  return (
    <p
      className={`${typography.caption} text-[var(--color-gray-500)] ${className}`}
    >
      Имеются противопоказания, необходима консультация специалиста.
    </p>
  );
}