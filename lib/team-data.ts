// lib/team-data.ts
//
// Только типы доменной модели сотрудника. Данные живут в БД и читаются
// через lib/team.ts. Демо-массив teamData удалён: он остался с этапа
// переноса в базу, и последним его читала страница «Клинические случаи»,
// из-за чего подписи под кейсами не совпадали с реальными врачами.

export type TeamCategory = "doctor" | "staff";

/**
 * Кем является сотрудник категории «персонал».
 *   assistant — карточка на странице «Команда» после врачей, но без
 *               своей страницы: кликать не по чему, информации нет.
 *   moderator — карточки на сайте нет вовсе, только учётная запись.
 * У врачей поле пустое.
 */
export type StaffKind = "assistant" | "moderator";

export type TeamMember = {
  slug: string;
  name: string;
  /** Имя в родительном падеже — для заголовка «Все кейсы …». */
  nameGenitive?: string;
  position: string;
  role: string;
  shortRole: string;
  /** Короткое описание для карточки. */
  excerpt: string;
  /** Полный текст для страницы /team/[slug]. */
  description: string;
  image: string;
  category: TeamCategory;
  /** Главный врач — всегда первый в списке. */
  isChief: boolean;
  /** Ведущий специалист направления. */
  isLead: boolean;
  /** Направление, которое ведёт сотрудник (если isLead). */
  leadDirectionSlug?: string;
  /** Все направления, в которых участвует. */
  directionSlugs?: string[];
  /** Цитата под hero (в стиле кейсов). */
  quote?: string;
  homeImage?: string;
  homeQuote?: string;
  doctorQuote?: string;
  leadImage?: string;
  leadQuote?: string;
  /** Счётчики (показатели): значение + подпись. */
  stats?: { value: string; label: string }[];
  /** Текст мини-карточки «Подход». */
  approach?: string;
  /** Пункты блока «Клинический фокус». */
  focusPoints?: string[];
  /** Пункты блока «Когда стоит обратиться». */
  visitPoints?: string[];
  /** Пройденные курсы (нумерованный список). */
  courses?: string[];
  /** Скан диплома специалиста (4:3). */
  diplomaImage?: string;
  /** Ручная сортировка внутри своей группы. */
  sortOrder: number;
  /** Совместимость со старыми компонентами: showcase на главной = chief || lead. */
  featured?: boolean;
  showOnHomepage?: boolean;
  isSpeaker?: boolean;
  /** Тип записи для категории «персонал». У врачей не задан. */
  staffKind?: StaffKind;
  /**
   * Доступ к заявкам и отзывам на модерации.
   * Флаг независим от типа карточки: включается врачу и ассистенту,
   * у staffKind = "moderator" стоит всегда.
   */
  isModerator?: boolean;
};