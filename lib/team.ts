import type { TeamMember } from "@/lib/team-data";
import { createPublicClient } from "@/lib/supabase-public";

// Строка БД (snake_case) -> доменная модель TeamMember (camelCase).
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
  courses: string[] | null;
  diploma_image: string | null;
};

const COLUMNS =
  "slug,name,position,role,short_role,excerpt,description,image,category,is_chief,is_lead,lead_direction_slug,direction_slugs,sort_order,stats,approach,focus_points,visit_points,quote,courses,diploma_image";

function mapRow(row: TeamRow): TeamMember {
  const featured = row.is_chief || row.is_lead;
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
    courses: row.courses ?? undefined,
    diplomaImage: row.diploma_image ?? undefined,
    featured,
    showOnHomepage: featured,
  };
}

// Иерархия списка: главный врач -> ведущие -> остальные врачи -> персонал.
function hierarchyRank(member: TeamMember): number {
  if (member.isChief) return 0;
  if (member.isLead) return 1;
  if (member.category === "doctor") return 2;
  return 3; // staff
}

function sortTeam(members: TeamMember[]): TeamMember[] {
  return [...members].sort((a, b) => {
    const rankDiff = hierarchyRank(a) - hierarchyRank(b);
    if (rankDiff !== 0) return rankDiff;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.name.localeCompare(b.name, "ru");
  });
}

/** Все сотрудники в правильном порядке — для страницы /team. */
export async function getTeamMembers(): Promise<TeamMember[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("team_members").select(COLUMNS);
  if (error) throw error;
  return sortTeam((data as TeamRow[]).map(mapRow));
}

/** Только ведущие (включая главного) — для блока команды на главной. */
export async function getFeaturedTeam(): Promise<TeamMember[]> {
  const all = await getTeamMembers();
  return all.filter((member) => member.isChief || member.isLead);
}

export async function getTeamMemberBySlug(
  slug: string
): Promise<TeamMember | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("team_members")
    .select(COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data as TeamRow) : null;
}

export async function getTeamSlugs(): Promise<string[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("team_members").select("slug");
  if (error) throw error;
  return (data as { slug: string }[]).map((row) => row.slug);
}

/** Ведущий специалист направления — для страницы /directions/[slug]. */
export async function getLeadByDirection(
  directionSlug: string
): Promise<TeamMember | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("team_members")
    .select(COLUMNS)
    .eq("is_lead", true)
    .eq("lead_direction_slug", directionSlug)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data as TeamRow) : null;
}