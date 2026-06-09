import type { MetadataRoute } from "next";
import { directionsData } from "@/lib/directions-data";
import { casesData } from "@/lib/cases-data";

export default function sitemap(): MetadataRoute.Sitemap {
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

  const casePages = casesData.map((item) => ({
    url: `${baseUrl}/cases/${item.slug}`,
    lastModified: new Date(),
  }));

  return [...staticPages, ...directionPages, ...casePages];
}