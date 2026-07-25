// lib/team.ts
import type { TeamMember } from "@/lib/team-data";
import { query, queryOne } from "@/lib/db";

type TeamRow = {
  slug: string;
  name: string;
  position: string;
  role: string;
  short_role: string;
  excerpt: string;
  description: string;
  image: string | null;
  category: "doctor" | "staff";
  is_chief: boolean;
  is_lead: boolean;
  lead_direction_slug: string | null;
  direction_slugs: string[] | null;
  sort_order: number;
  stats: { value: string; label: string }[] | null;
  approach: string | null;
  focus_points: string[] | null;
  visit_points: string[] | null;
  quote: string | null;
  lead_image: string | null;
  lead_quote: string | null;
  home_image: string | null;
  home_quote: string | null;
  doctor_quote: string | null;
  courses: string[] | null;
  diploma_image: string | null;
  name_genitive: string | null;
  show_on_homepage: boolean | null;
  is_speaker: boolean | null;
  staff_kind: string | null;
  is_moderator: boolean | null;
};

const COLUMNS =
  "slug, name, position, role, short_role, excerpt, description, image, category, is_chief, is_lead, lead_direction_slug, direction_slugs, sort_order, stats, approach, focus_points, visit_points, quote, lead_image, lead_quote, home_image, home_quote, doctor_quote, courses, diploma_image, name_genitive, show_on_homepage, is_speaker, staff_kind, is_moderator";

const HOMEPAGE_LIMIT = 5;

// «Модератор» — учётная запись без карточки на сайте.
const HAS_PUBLIC_CARD = "(staff_kind is null or staff_kind <> 'moderator')";

function mapRow(row: TeamRow): TeamMember {
  const featured = row.is_chief || row.is_lead;
  const showOnHomepage = row.show_on_homepage ?? true;
  return {
    slug: row.slug,
    name: row.name,
    position: row.position,
    role: row.role,
    shortRole: row.short_role,
    excerpt: row.excerpt,
    description: row.description,
    image: row.image?.trim() || "",
    category: row.category,
    isChief: row.is_chief,
    isLead: row.is_lead,
    leadDirectionSlug: row.lead_direction_slug ?? undefined,
    directionSlugs: row.direction_slugs ?? undefined,
    sortOrder: row.sort_order,
    stats: row.stats ?? undefined,
    approach: row.approach ?? undefined,
    focusPoints: row.focus_points ?? undefined,
    visitPoints: row.visit_points ?? undefined,
    quote: row.quote ?? undefined,
    leadImage: row.lead_image ?? undefined,
    leadQuote: row.lead_quote ?? undefined,
    homeImage: row.home_image ?? undefined,
    homeQuote: row.home_quote ?? undefined,
    doctorQuote: row.doctor_quote ?? undefined,
    courses: row.courses ?? undefined,
    diplomaImage: row.diploma_image ?? undefined,
    nameGenitive: row.name_genitive ?? undefined,
    featured,
    showOnHomepage,
    isSpeaker: row.is_speaker ?? false,
    staffKind:
      row.staff_kind === "assistant" || row.staff_kind === "moderator"
        ? row.staff_kind
        : undefined,
    isModerator: row.is_moderator ?? false,
  };
}

function hierarchyRank(member: TeamMember): number {
  if (member.isChief) return 0;
  if (member.isLead) return 1;
  if (member.category === "doctor") return 2;
  return 3;
}

function sortTeam(members: TeamMember[]): TeamMember[] {
  return [...members].sort((a, b) => {
    const rankDiff = hierarchyRank(a) - hierarchyRank(b);
    if (rankDiff !== 0) return rankDiff;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.name.localeCompare(b.name, "ru");
  });
}

/**
 * Публичные списки: без архивных и без «модераторов».
 *
 * Персонал идёт после врачей — это задаёт hierarchyRank, а sort_order
 * управляет порядком уже внутри своей группы.
 */
export async function getTeamMembers(): Promise<TeamMember[]> {
  const rows = await query<TeamRow>(
    `select ${COLUMNS} from team_members
      where archived = false and ${HAS_PUBLIC_CARD}`
  );
  return sortTeam(rows.map(mapRow));
}

/**
 * Только врачи. Для любых списков выбора: кейсы, курсы, форма отзыва.
 *
 * Ассистент не ведёт случай и не читает курс, поэтому появляться в этих
 * списках не должен. Отдельная функция вместо фильтра на каждой
 * странице: так новое место выбора врача нельзя завести с ошибкой.
 */
export async function getDoctors(): Promise<TeamMember[]> {
  const rows = await query<TeamRow>(
    `select ${COLUMNS} from team_members
      where archived = false and category = 'doctor'`
  );
  return sortTeam(rows.map(mapRow));
}

/**
 * Все сотрудники, включая архивных и модераторов.
 *
 * Нужен админке и любым картам «слаг -> имя»: у кейсов, отзывов и курсов
 * архивного врача иначе появилось бы «Врач не найден». Публичные страницы
 * этой функцией пользоваться не должны.
 */
export async function getTeamMembersAll(): Promise<TeamMember[]> {
  const rows = await query<TeamRow>(`select ${COLUMNS} from team_members`);
  return sortTeam(rows.map(mapRow));
}

/**
 * Только главная страница: врачи, отмеченные к показу.
 * Персонал на главную не выводится вовсе.
 */
export async function getFeaturedTeam(): Promise<TeamMember[]> {
  const all = await getDoctors();
  return all.filter((member) => member.showOnHomepage).slice(0, HOMEPAGE_LIMIT);
}

/**
 * Карточка по слагу — архив НЕ фильтруется сознательно.
 *
 * Архивный врач пропадает из списка команды, но его имя должно
 * по-прежнему подставляться в кейсы и курсы, а страница — открываться
 * по прямой ссылке. Та же логика, что у архивных курсов и кейсов.
 */
export async function getTeamMemberBySlug(
  slug: string
): Promise<TeamMember | null> {
  const row = await queryOne<TeamRow>(
    `select ${COLUMNS} from team_members where slug = $1`,
    [slug]
  );
  return row ? mapRow(row) : null;
}

/** Слаги для карты сайта и generateStaticParams — только у кого есть страница. */
export async function getTeamSlugs(): Promise<string[]> {
  const rows = await query<{ slug: string }>(
    `select slug from team_members
      where archived = false and category = 'doctor'`
  );
  return rows.map((row) => row.slug);
}

/**
 * Ведущий направления — архивные исключены: архивный врач не должен
 * оставаться лицом направления на публичной странице.
 */
export async function getLeadByDirection(
  directionSlug: string
): Promise<TeamMember | null> {
  const row = await queryOne<TeamRow>(
    `select ${COLUMNS} from team_members
      where is_lead = true and lead_direction_slug = $1 and archived = false`,
    [directionSlug]
  );
  return row ? mapRow(row) : null;
}