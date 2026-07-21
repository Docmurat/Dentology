import type { MetadataRoute } from "next";
import { getPublishedCourses } from "@/lib/courses";
import { getAllCases } from "@/lib/cases";
import { getTeamMembers } from "@/lib/team";
import { getDirections } from "@/lib/directions-db";

const BASE = "https://lucenta.ru";

const STATIC_PATHS = [
  "",
  "/cases",
  "/team",
  "/about",
  "/education",
  "/contacts",
  "/reviews",
  "/sitemap",
  "/legal/privacy",
  "/legal/license",
];

// Безопасно собирает URL из источника: при ошибке БД возвращает пустой список,
// чтобы карта сайта не падала целиком.
async function collect(
  loader: () => Promise<{ slug: string }[]>,
  prefix: string
): Promise<MetadataRoute.Sitemap> {
  try {
    const items = await loader();
    return items.map((i) => ({
      url: `${BASE}${prefix}/${i.slug}`,
      lastModified: new Date(),
    }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url: `${BASE}${p}`,
    lastModified: new Date(),
  }));

  const [directions, team, cases, courses] = await Promise.all([
    collect(getDirections, "/directions"),
    collect(getTeamMembers, "/team"),
    collect(getAllCases, "/cases"),
    collect(getPublishedCourses, "/education"),
  ]);

  return [...staticRoutes, ...directions, ...team, ...cases, ...courses];
}