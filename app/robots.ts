import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/doctor", "/api"],
    },
    sitemap: "https://lucenta.ru/sitemap.xml",
  };
}