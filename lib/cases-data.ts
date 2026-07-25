// lib/cases-data.ts
//
// Только типы доменной модели кейса. Данные живут в БД и читаются
// через lib/cases.ts. Демо-массив casesData удалён: он остался
// с этапа, когда контента в базе ещё не было, и ни на что не влиял.

export type ContentBlock = {
  title: string;
  body: string;
  images: string[];
  float: "left" | "right" | "none";
};

export type CaseItem = {
  slug: string;
  title: string;
  excerpt: string;
  directionSlug: string;
  coverImage?: string;
  imageBefore?: string;
  imageAfter?: string;
  protocolImages?: string[];
  doctorSlug?: string;
  /**
   * Снимок имени врача на момент публикации кейса.
   * Кейс — самодостаточный документ: он переживает удаление карточки
   * врача и сохраняет, кто был автором. Живое имя, если карточка есть,
   * имеет приоритет — фамилия могла измениться.
   */
  doctorName?: string;
  situation: string;
  diagnostics: string;
  decision: string;
  result: string;
  doctorWords?: string;
  contentBlocks?: ContentBlock[];
};