// lib/endo-prices.ts
//
// Этапы и стоимость лечения каналов: типы, значения по умолчанию и
// расчёт итога. Без доступа к базе — модуль подключают и клиентские
// компоненты (инфографика, редактор в админке). Чтение из базы —
// getEndoPricesContent в lib/homepage.ts.

/** Какое состояние зуба показывает картинка на этом этапе. */
export const TOOTH_VISUALS = [
  { key: "start", label: "Исходное состояние" },
  { key: "prebuild", label: "Стенки восстановлены (пребилд)" },
  { key: "post", label: "Штифт извлечён" },
  { key: "instrument", label: "Обломок инструмента извлечён" },
  { key: "canals", label: "Каналы запломбированы" },
  { key: "restored", label: "Зуб восстановлен" },
  { key: "control", label: "Воспаление ушло (контроль)" },
] as const;
export type ToothVisual = (typeof TOOTH_VISUALS)[number]["key"];

export type EndoScenario = "primary" | "retreat";

export type EndoStage = {
  title: string;
  text: string;
  /** Цена в рублях. 0 — цена не показывается. */
  price: number;
  /** «от 4 000 ₽» вместо «4 000 ₽». */
  priceFrom: boolean;
  /** Цена указана за один канал и умножается на их число. */
  perCanal: boolean;
  /** Для какого лечения этап: оба, только первичное или перелечивание. */
  scenario: "both" | EndoScenario;
  /** Этап нужен не всегда — тогда он не входит в обязательную сумму. */
  optional: boolean;
  /** Когда нужен необязательный этап: «если в канале штифт». */
  condition: string;
  visual: ToothVisual;
};

export type EndoPricesContent = {
  eyebrow: string;
  title: string;
  description: string;
  stages: EndoStage[];
  /** Пояснения под итогом: коронка, оферта и т.п. — по строке. */
  notes: string[];
};

export const ENDO_PRICES_DEFAULTS: EndoPricesContent = {
  eyebrow: "Стоимость",
  title: "Этапы лечения каналов и их стоимость",
  description:
    "Выберите, лечился ли зуб раньше, и сколько в нём каналов. Пролистайте этапы — зуб на картинке будет меняться вместе с ними.",
  stages: [
    {
      title: "Пребилд — предварительное восстановление",
      text: "Если зуб сильно разрушен или в нём старая композитная реставрация, сначала восстанавливаем стенки зуба. Так каналы на время лечения надёжно изолированы от слюны.",
      price: 7500,
      priceFrom: false,
      perCanal: false,
      scenario: "both",
      optional: true,
      condition: "если зуб сильно разрушен или есть старая реставрация",
      visual: "prebuild",
    },
    {
      title: "Извлечение штифта",
      text: "Если в канале стоит штифт после прошлого лечения, его аккуратно извлекают, чтобы открыть доступ к каналу.",
      price: 4000,
      priceFrom: true,
      perCanal: false,
      scenario: "retreat",
      optional: true,
      condition: "если в канале есть штифт",
      visual: "post",
    },
    {
      title: "Извлечение сломанного инструмента",
      text: "Если в канале остался обломок инструмента, его извлекают под микроскопом, чтобы канал можно было пройти до конца.",
      price: 10000,
      priceFrom: false,
      perCanal: false,
      scenario: "retreat",
      optional: true,
      condition: "если в канале остался обломок инструмента",
      visual: "instrument",
    },
    {
      title: "Лечение канала",
      text: "Очистка и обработка канала, лечебный материал между визитами, если он нужен, и пломбирование канала.",
      price: 10000,
      priceFrom: false,
      perCanal: true,
      scenario: "primary",
      optional: false,
      condition: "",
      visual: "canals",
    },
    {
      title: "Перелечивание канала",
      text: "Распломбировка — удаление старого материала из канала, очистка и обработка, временный лечебный материал (лекарство) и пломбирование канала.",
      price: 12000,
      priceFrom: false,
      perCanal: true,
      scenario: "retreat",
      optional: false,
      condition: "",
      visual: "canals",
    },
    {
      title: "Пост-билдап — восстановление после лечения",
      text: "После лечения каналов восстанавливаем коронковую часть зуба и герметично закрываем каналы.",
      price: 7500,
      priceFrom: false,
      perCanal: false,
      scenario: "both",
      optional: false,
      condition: "",
      visual: "restored",
    },
    {
      title: "Контроль",
      text: "Через 6–12 месяцев делаем контрольный снимок и смотрим, как заживает кость вокруг корня.",
      price: 0,
      priceFrom: false,
      perCanal: false,
      scenario: "both",
      optional: false,
      condition: "",
      visual: "control",
    },
  ],
  notes: [
    "Цены ориентировочные. Точный план и стоимость врач определяет после осмотра и диагностики.",
    "Коронка или вкладка, если она понадобится после лечения, рассчитывается отдельно.",
  ],
};

const VISUAL_KEYS = new Set<string>(TOOTH_VISUALS.map((v) => v.key));

/** Приводит этап из базы к ожидаемому виду: битые поля заменяются. */
export function normalizeEndoStage(raw: Partial<EndoStage>): EndoStage | null {
  const title = String(raw?.title ?? "").trim();
  if (!title) return null;
  const price = Number(raw?.price);
  const scenario =
    raw?.scenario === "primary" || raw?.scenario === "retreat"
      ? raw.scenario
      : "both";
  return {
    title,
    text: String(raw?.text ?? "").trim(),
    price: Number.isFinite(price) && price > 0 ? Math.round(price) : 0,
    priceFrom: Boolean(raw?.priceFrom),
    perCanal: Boolean(raw?.perCanal),
    scenario,
    optional: Boolean(raw?.optional),
    condition: String(raw?.condition ?? "").trim(),
    visual: VISUAL_KEYS.has(String(raw?.visual))
      ? (raw!.visual as ToothVisual)
      : "start",
  };
}


/** Этапы, которые относятся к выбранному сценарию лечения. */
export function stagesFor(
  stages: EndoStage[],
  scenario: EndoScenario
): EndoStage[] {
  return stages.filter((s) => s.scenario === "both" || s.scenario === scenario);
}

/** Цена этапа с учётом числа каналов (0 — цены нет). */
export function stageCost(stage: EndoStage, canals: number): number {
  return stage.perCanal ? stage.price * canals : stage.price;
}

/**
 * Ориентировочный итог: обязательные этапы и, отдельно, необязательные.
 * fromPrice — в сумме есть цены «от», итог тоже показывается как «от».
 */
export function estimate(
  stages: EndoStage[],
  scenario: EndoScenario,
  canals: number
): { base: number; extras: number; fromPrice: boolean } {
  let base = 0;
  let extras = 0;
  let fromPrice = false;
  for (const stage of stagesFor(stages, scenario)) {
    const cost = stageCost(stage, canals);
    if (!cost) continue;
    if (stage.optional) extras += cost;
    else base += cost;
    if (stage.priceFrom) fromPrice = true;
  }
  return { base, extras, fromPrice };
}

/** 12000 → «12 000 ₽» (неразрывные пробелы, как принято в русском наборе). */
export function formatRub(value: number): string {
  return `${value.toLocaleString("ru-RU").replace(/\s/g, "\u00a0")}\u00a0₽`;
}
