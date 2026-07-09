// Разбор полей формы курса. Отдельный модуль (не "use server"),
// чтобы переиспользовать в экшенах админа и спикера.

function parseMetricsInput(raw: string): { value: string; label: string }[] {
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((m) => ({
        value: String(m?.value ?? "").trim(),
        label: String(m?.label ?? "").trim(),
      }))
      .filter((m) => m.value || m.label);
  } catch {
    return [];
  }
}

function parseFaqInput(raw: string): { q: string; a: string }[] {
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((f) => ({
        q: String(f?.q ?? "").trim(),
        a: String(f?.a ?? "").trim(),
      }))
      .filter((f) => f.q || f.a);
  } catch {
    return [];
  }
}

function parseProgramInput(
  raw: string
): { title: string; items: string[] }[] {
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((m) => ({
        title: String(m?.title ?? "").trim(),
        items: Array.isArray(m?.items)
          ? m.items.map((x: unknown) => String(x ?? "").trim()).filter(Boolean)
          : [],
      }))
      .filter((m) => m.title || m.items.length);
  } catch {
    return [];
  }
}

type FormatInput = {
  type: string;
  summary: string;
  points: string[];
  duration: string;
  price: string;
  priceNote: string;
  ctaLabel: string;
  recommended: boolean;
  enabled: boolean;
};

function parseFormatsInput(raw: string): FormatInput[] {
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((f) => ({
        type: String(f?.type ?? "").trim(),
        summary: String(f?.summary ?? "").trim(),
        points: Array.isArray(f?.points)
          ? f.points.map((x: unknown) => String(x ?? "").trim()).filter(Boolean)
          : [],
        duration: String(f?.duration ?? "").trim(),
        price: String(f?.price ?? "").trim(),
        priceNote: String(f?.priceNote ?? "").trim(),
        ctaLabel: String(f?.ctaLabel ?? "").trim(),
        recommended: Boolean(f?.recommended),
        enabled: f?.enabled === undefined ? true : Boolean(f?.enabled),
      }))
      .filter((f) => f.type);
  } catch {
    return [];
  }
}

export function readCourseFields(formData: FormData) {
  const formats = parseFormatsInput(String(formData.get("formats") || "[]"));
  return {
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    doctor_slug: String(formData.get("doctorSlug") || "") || null,
    direction_slugs: formData
      .getAll("directionSlug")
      .map(String)
      .filter(Boolean),
    learning_formats: formats,
    learning_types: formats.filter((f) => f.enabled).map((f) => f.type),
    audience_title: String(formData.get("audienceTitle") || "").trim() || null,
    audience_text: String(formData.get("audienceText") || "").trim() || null,
    outcomes_title: String(formData.get("outcomesTitle") || "").trim() || null,
    outcomes_text: String(formData.get("outcomesText") || "").trim() || null,
    instructor_bio: String(formData.get("instructorBio") || "").trim() || null,
    cta_note: String(formData.get("ctaNote") || "").trim() || null,
    faq: parseFaqInput(String(formData.get("faq") || "[]")),
    program: parseProgramInput(String(formData.get("program") || "[]")),
    metrics: parseMetricsInput(String(formData.get("metrics") || "[]")),
    quote: String(formData.get("quote") || "").trim() || null,
    quote_image: String(formData.get("quoteImage") || "") || null,
    effectiveness_percent:
      Number(formData.get("effectivenessPercent") || 0) || 0,
    effectiveness_text:
      String(formData.get("effectivenessText") || "").trim() || null,
    show_metrics: formData.get("showMetrics") === "on",
    show_audience: formData.get("showAudience") === "on",
    show_outcomes: formData.get("showOutcomes") === "on",
    show_quote: formData.get("showQuote") === "on",
    show_program: formData.get("showProgram") === "on",
    show_faq: formData.get("showFaq") === "on",
    show_effectiveness: formData.get("showEffectiveness") === "on",
    show_bio: formData.get("showBio") === "on",
    show_cta: formData.get("showCta") === "on",
    published: formData.get("published") === "on",
    sort_order: Number(formData.get("sortOrder") || 0) || 0,
  };
}