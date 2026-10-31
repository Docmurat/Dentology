// lib/price-list.ts
//
// Страница «Цены»: разделы по направлениям и позиции в них. Типы,
// значения по умолчанию и приведение данных из базы. Без доступа к базе —
// модуль подключает и редактор в админке. Чтение — getPriceListContent
// в lib/homepage.ts.
//
// Часть строк берётся из других блоков, чтобы одна цена не жила в двух
// местах и не расходилась:
//   source "endo-stages"   — этапы лечения каналов (инфографика);
//   source "consultation"  — цена консультации (блок «Как проходит консультация»).
// Ручные позиции раздела показываются после них.

export type PriceItem = {
  name: string;
  /** Цена в рублях. 0 — «по запросу». */
  price: number;
  priceFrom: boolean;
  /** «за канал», «за зуб», «за единицу» — пусто, если не нужно. */
  unit: string;
  /** Пояснение под названием. */
  note: string;
};

export type PriceSource = "none" | "endo-stages" | "consultation";

export type PriceCategory = {
  /** Якорь на странице: /prices#endodontics. */
  slug: string;
  title: string;
  description: string;
  /** Направление на сайте — для ссылки «Подробнее о направлении». */
  directionSlug: string;
  source: PriceSource;
  items: PriceItem[];
};

export type PriceListContent = {
  title: string;
  description: string;
  categories: PriceCategory[];
  notes: string[];
};

export const PRICE_LIST_DEFAULTS: PriceListContent = {
  title: "Цены на лечение",
  description:
    "Стоимость основных услуг по направлениям. Точный план и стоимость врач определяет после осмотра и диагностики.",
  categories: [
    {
      slug: "consultation",
      title: "Консультация и диагностика",
      description: "",
      directionSlug: "",
      source: "consultation",
      items: [],
    },
    {
      slug: "endodontics",
      title: "Эндодонтия — лечение каналов",
      description:
        "Лечение и перелечивание корневых каналов под микроскопом. Цена лечения зависит от числа каналов.",
      directionSlug: "endodontics",
      source: "endo-stages",
      items: [],
    },
    {
      slug: "restoration",
      title: "Реставрация зубов",
      description:
        "Восстановление зуба композитом. Цена зависит от числа восстанавливаемых поверхностей.",
      directionSlug: "restoration",
      source: "none",
      items: [
        {
          name: "Восстановление зуба: одна поверхность",
          price: 6500,
          priceFrom: false,
          unit: "",
          note: "",
        },
        {
          name: "Восстановление зуба: две поверхности",
          price: 8500,
          priceFrom: false,
          unit: "",
          note: "",
        },
        {
          name: "Восстановление зуба: три поверхности",
          price: 10500,
          priceFrom: false,
          unit: "",
          note: "",
        },
        {
          name: "Фронтальная эстетическая реставрация",
          price: 12000,
          priceFrom: true,
          unit: "за зуб",
          note: "",
        },
      ],
    },
    {
      slug: "prosthetics",
      title: "Ортопедия — протезирование",
      description: "",
      directionSlug: "prosthetics",
      source: "none",
      items: [
        {
          name: "Керамическая коронка",
          price: 40000,
          priceFrom: false,
          unit: "за единицу",
          note: "",
        },
        {
          name: "Временная коронка",
          price: 15000,
          priceFrom: false,
          unit: "за единицу",
          note: "",
        },
      ],
    },
    {
      slug: "implantation",
      title: "Имплантация",
      description: "",
      directionSlug: "implantation",
      source: "none",
      items: [
        {
          name: "Имплантат Osstem или Dentium (Корея)",
          price: 45000,
          priceFrom: false,
          unit: "",
          note: "",
        },
        {
          name: "Имплантат Straumann (Швейцария)",
          price: 90000,
          priceFrom: false,
          unit: "",
          note: "",
        },
      ],
    },
    {
      slug: "surgery",
      title: "Хирургия",
      description: "",
      directionSlug: "",
      source: "none",
      items: [
        {
          name: "Удаление зуба",
          price: 7000,
          priceFrom: true,
          unit: "",
          note: "",
        },
      ],
    },
    {
      slug: "hygiene",
      title: "Гигиена",
      description: "",
      directionSlug: "",
      source: "none",
      items: [
        {
          name: "Профессиональная гигиена полости рта",
          price: 7000,
          priceFrom: false,
          unit: "",
          note: "",
        },
        {
          name: "Гигиена с ортодонтической конструкцией",
          price: 10000,
          priceFrom: false,
          unit: "",
          note: "Брекеты, элайнеры и другие конструкции",
        },
        {
          name: "Гигиена для пациентов на ортодонтическом лечении в нашей клинике",
          price: 5000,
          priceFrom: false,
          unit: "раз в 3 месяца",
          note: "",
        },
        {
          name: "Гигиена курильщика",
          price: 12000,
          priceFrom: false,
          unit: "",
          note: "",
        },
        {
          name: "Пародонтологическая чистка",
          price: 15000,
          priceFrom: false,
          unit: "",
          note: "С кюретажем под увеличением",
        },
      ],
    },
  ],
  notes: [
    "Цены указаны в рублях и носят ориентировочный характер. Окончательная стоимость определяется планом лечения после осмотра.",
    "Информация на странице не является публичной офертой. Полный прейскурант можно получить в клинике.",
  ],
};

const SLUG_RE = /^[a-z0-9-]{1,40}$/;

export function normalizePriceItem(raw: Partial<PriceItem>): PriceItem | null {
  const name = String(raw?.name ?? "").trim();
  if (!name) return null;
  const price = Number(raw?.price);
  return {
    name,
    price: Number.isFinite(price) && price > 0 ? Math.round(price) : 0,
    priceFrom: Boolean(raw?.priceFrom),
    unit: String(raw?.unit ?? "").trim(),
    note: String(raw?.note ?? "").trim(),
  };
}

export function normalizePriceCategory(
  raw: Partial<PriceCategory>,
): PriceCategory | null {
  const title = String(raw?.title ?? "").trim();
  if (!title) return null;
  const slugRaw = String(raw?.slug ?? "")
    .trim()
    .toLowerCase();
  const source: PriceSource =
    raw?.source === "endo-stages" || raw?.source === "consultation"
      ? raw.source
      : "none";
  return {
    slug: SLUG_RE.test(slugRaw) ? slugRaw : "",
    title,
    description: String(raw?.description ?? "").trim(),
    directionSlug: String(raw?.directionSlug ?? "").trim(),
    source,
    items: Array.isArray(raw?.items)
      ? raw.items
          .map((it) => normalizePriceItem(it))
          .filter((it): it is PriceItem => it !== null)
      : [],
  };
}
