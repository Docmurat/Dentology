import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lucenta — заявки",
    short_name: "Lucenta",
    description: "Заявки с сайта клиники Lucenta",
    // Staff install this to receive lead notifications, so the app opens
    // straight on the leads board rather than the public homepage.
    start_url: "/moderator",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#12324F",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}