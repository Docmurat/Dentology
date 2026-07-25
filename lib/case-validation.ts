// lib/case-validation.ts
//
// Правила по картинкам кейса. Один модуль на клиент и сервер, чтобы
// форма и экшены не расходились в формулировках и в самих условиях.

export const CASE_ERRORS = {
  cover:
    "Загрузите обложку. Без неё кейс не показывается в списках и не может быть опубликован.",
  beforeAfter:
    "Блок «до / после» включён, но загружены не оба снимка. Добавьте недостающий или выключите блок.",
} as const;

export type CaseImageFields = {
  cover_image: string | null;
  image_before: string | null;
  image_after: string | null;
  show_before_after: boolean;
};

/**
 * Проверка картинок кейса. Возвращает текст ошибки или null.
 *
 * Обложка обязательна всегда: карточка кейса без неё выглядит пустым
 * серым прямоугольником на главной, в направлении и на странице врача.
 *
 * Блок «до / после» требует обе картинки. С одной он рисует наполовину
 * пустой контейнер сравнения — ровно та проблема, из-за которой блок
 * и сделали отключаемым.
 */
export function validateCaseImages(fields: CaseImageFields): string | null {
  if (!fields.cover_image) return CASE_ERRORS.cover;

  if (
    fields.show_before_after &&
    (!fields.image_before || !fields.image_after)
  ) {
    return CASE_ERRORS.beforeAfter;
  }

  return null;
}