import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/doctor", "/cabinet", "/api"],
    },
    sitemap: "https://lucenta.ru/sitemap.xml",
  };
}