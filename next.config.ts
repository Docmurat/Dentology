// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Загрузка картинки ограничена 15 МБ в app/admin/upload-actions.ts.
      // Держим лимит тела рядом с ним: 100 МБ позволяли раздуть память
      // процесса одним запросом от любого авторизованного пользователя.
      bodySizeLimit: "20mb",
    },
  },
  images: {
    remotePatterns: [
      {
        // Yandex Object Storage — картинки кейсов, команды, отзывов.
        protocol: "https",
        hostname: "storage.yandexcloud.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "unavatar.io",
      },
    ],
  },
  async headers() {
    return [
      {
        // A cached service worker would keep serving stale push logic
        // long after a deploy.
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;