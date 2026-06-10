import type { MetadataRoute } from "next";
import { directionsData } from "@/lib/directions-data";
import { getCaseSlugs } from "@/lib/cases";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://dentology.ru";

  const staticPages = [
    "",
    "/directions",
    "/cases",
    "/about",
    "/education",
    "/contacts",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }));

  const directionPages = directionsData.map((item) => ({
    url: `${baseUrl}/directions/${item.slug}`,
    lastModified: new Date(),
  }));

  const caseSlugs = await getCaseSlugs();
  const casePages = caseSlugs.map((slug) => ({
    url: `${baseUrl}/cases/${slug}`,
    lastModified: new Date(),
  }));

  return [...staticPages, ...directionPages, ...casePages];
}