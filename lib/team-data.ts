export type TeamMember = {
  slug: string;
  name: string;
  role: string;
  shortRole: string;
  description: string;
  image: string;
  featured?: boolean;
  showOnHomepage?: boolean;
  directionSlugs?: string[];
};

export const teamData: TeamMember[] = [
  {
    slug: "lead-doctor",
    name: "Мурат Курджиев",
    role: "Врач-стоматолог. Ведущий фокус — сложная эндодонтия",
    shortRole: "Эндодонтия",
    description:
      "Основной клинический фокус — сохранение зубов, повторное эндодонтическое лечение и работа со случаями, где ранее рекомендовано удаление.",
    image: "/murat-kurdzhie.jpg",
    featured: true,
    showOnHomepage: true,
    directionSlugs: ["endodontics"],
  },
  {
    slug: "implantology",
    name: "Специалист по имплантации",
    role: "Имплантация",
    shortRole: "Имплантация",
    description:
      "Подключается в тех случаях, когда сохранение зуба невозможно и требуется продуманное восстановление функции.",
    image: "/team-placeholder-1.jpg",
    featured: true,
    showOnHomepage: true,
    directionSlugs: ["implantation"],
  },
  {
    slug: "gnathology",
    name: "Специалист по гнатологии",
    role: "Гнатология",
    shortRole: "Гнатология",
    description:
      "Работает с функциональными нарушениями, связанными с прикусом, суставом и общей биомеханикой зубочелюстной системы.",
    image: "/team-placeholder.jpg",
    featured: true,
    showOnHomepage: true,
    directionSlugs: ["gnathology"],
  },
  {
    slug: "prosthetic-doctor",
    name: "Специалист по ортопедии",
    role: "Ортопедия и микропротезирование",
    shortRole: "Ортопедия",
    description:
      "Отвечает за восстановление зубов, включая накладки, виниры и другие решения в рамках комплексного плана лечения.",
    image: "/team-placeholde.jpg",
    featured: true,
    showOnHomepage: true,
    directionSlugs: ["prosthetics"],
  },
  {
    slug: "restorative-doctor",
    name: "Татьяна Макеева",
    role: "Эстетические реставрации",
    shortRole: "Реставрация",
    description:
      "Эстетические реставрации и композитные виниры. Работа с формой, цветом и детализацией улыбки без избыточного вмешательства в структуру зуба.",
    image: "/restorative-doctor.jpg",
    featured: true,
    showOnHomepage: true,
    directionSlugs: ["restoration"],
  },
];