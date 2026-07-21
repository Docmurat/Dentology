// Дисклеймер по ч. 7 ст. 24 ФЗ «О рекламе» — на страницах услуг/направлений.
export function ContraindicationsNote({
  className = "",
}: {
  className?: string;
}) {
  return (
    <p
      className={`text-xs leading-6 text-[var(--color-gray-500)] ${className}`}
    >
      Имеются противопоказания, необходима консультация специалиста.
    </p>
  );
}