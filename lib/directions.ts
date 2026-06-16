// Единый источник названий направлений по slug — для ярлыков на карточках
// кейсов и фильтров. Раньше эту роль играло отдельное поле category.
export const DIRECTION_LABELS: Record<string, string> = {
  endodontics: "Эндодонтия",
  implantation: "Имплантация",
  gnathology: "Гнатология",
  prosthetics: "Ортопедия",
  restoration: "Реставрация",
};

export function directionLabel(slug?: string | null): string {
  if (!slug) return "";
  return DIRECTION_LABELS[slug] ?? slug;
}
