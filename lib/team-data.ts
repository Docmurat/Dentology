// Доменная модель сотрудника. Используется и публичными страницами,
// и сидом для переноса в Supabase.
export type TeamCategory = "doctor" | "staff";

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
  /** Счётчики (показатели): значение + подпись. */
  homeImage?: string;
  homeQuote?: string;
  doctorQuote?: string;
  leadImage?: string;
  leadQuote?: string;
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
};

export const teamData: TeamMember[] = [
  {
    slug: "lead-doctor",
    name: "Мурат Курджиев",
    position: "Главный врач",
    role: "Врач-стоматолог. Ведущий фокус — сложная эндодонтия",
    shortRole: "Эндодонтия",
    excerpt:
      "Сохранение зубов, повторное эндодонтическое лечение и случаи, где ранее рекомендовали удаление.",
    description:
      "Основной клинический фокус — сохранение зубов, повторное эндодонтическое лечение и работа со случаями, где ранее рекомендовано удаление. Подход строится вокруг точной диагностики и междисциплинарного планирования.",
    image: "/murat-kurdzhie.jpg",
    category: "doctor",
    isChief: true,
    isLead: true,
    leadDirectionSlug: "endodontics",
    directionSlugs: ["endodontics"],
    sortOrder: 0,
    featured: true,
    showOnHomepage: true,
  },
  {
    slug: "implantology",
    name: "Специалист по имплантации",
    position: "Врач-имплантолог",
    role: "Имплантация",
    shortRole: "Имплантация",
    excerpt:
      "Подключается, когда сохранение зуба невозможно и требуется восстановление функции.",
    description:
      "Подключается в тех случаях, когда сохранение зуба невозможно и требуется продуманное восстановление функции.",
    image: "/team-placeholder-1.jpg",
    category: "doctor",
    isChief: false,
    isLead: true,
    leadDirectionSlug: "implantation",
    directionSlugs: ["implantation"],
    sortOrder: 1,
    featured: true,
    showOnHomepage: true,
  },
  {
    slug: "gnathology",
    name: "Специалист по гнатологии",
    position: "Врач-гнатолог",
    role: "Гнатология",
    shortRole: "Гнатология",
    excerpt:
      "Функциональные нарушения прикуса, сустава и биомеханики зубочелюстной системы.",
    description:
      "Работает с функциональными нарушениями, связанными с прикусом, суставом и общей биомеханикой зубочелюстной системы.",
    image: "/team-placeholder.jpg",
    category: "doctor",
    isChief: false,
    isLead: true,
    leadDirectionSlug: "gnathology",
    directionSlugs: ["gnathology"],
    sortOrder: 2,
    featured: true,
    showOnHomepage: true,
  },
  {
    slug: "prosthetic-doctor",
    name: "Специалист по ортопедии",
    position: "Врач-ортопед",
    role: "Ортопедия и микропротезирование",
    shortRole: "Ортопедия",
    excerpt:
      "Восстановление зубов: накладки, виниры и решения в рамках комплексного плана.",
    description:
      "Отвечает за восстановление зубов, включая накладки, виниры и другие решения в рамках комплексного плана лечения.",
    image: "/team-placeholde.jpg",
    category: "doctor",
    isChief: false,
    isLead: true,
    leadDirectionSlug: "prosthetics",
    directionSlugs: ["prosthetics"],
    sortOrder: 3,
    featured: true,
    showOnHomepage: true,
  },
  {
    slug: "restorative-doctor",
    name: "Татьяна Макеева",
    position: "Врач-реставратор",
    role: "Эстетические реставрации",
    shortRole: "Реставрация",
    excerpt:
      "Эстетические реставрации и композитные виниры без избыточного вмешательства.",
    description:
      "Эстетические реставрации и композитные виниры. Работа с формой, цветом и детализацией улыбки без избыточного вмешательства в структуру зуба.",
    image: "/restorative-doctor.jpg",
    category: "doctor",
    isChief: false,
    isLead: true,
    leadDirectionSlug: "restoration",
    directionSlugs: ["restoration"],
    sortOrder: 4,
    featured: true,
    showOnHomepage: true,
  },
];