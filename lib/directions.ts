// Подпись направления по slug.
//
// Фолбэк-карта DIRECTION_LABELS покрывает изначальные направления, чтобы
// подписи работали даже без обращения к БД (и в синхронных местах рендера).
// Для направлений, добавленных через админку, сервер-компоненты передают
// актуальную карту из getDirectionLabelMap() вторым аргументом.
//
// ВАЖНО: если направление удалили, его slug всё ещё может встречаться в
// старых кейсах/отзывах. Тогда возвращается сам slug — ничего не падает,
// структура кейсов и отзывов сохраняется.
export const DIRECTION_LABELS: Record<string, string> = {
  endodontics: "Эндодонтия",
  implantation: "Имплантация",
  gnathology: "Гнатология",
  prosthetics: "Ортопедия",
  restoration: "Реставрация",
  orthodontics: "Ортодонтия",
};

export function directionLabel(
  slug?: string | null,
  labelMap?: Record<string, string>
): string {
  if (!slug) return "";
  return labelMap?.[slug] ?? DIRECTION_LABELS[slug] ?? slug;
}