import type { MetadataRoute } from "next";

type ExtendedManifest = MetadataRoute.Manifest & {
  display_override?: string[];
  screenshots?: Array<{
    form_factor?: "narrow" | "wide";
    sizes: string;
    src: string;
    type: string;
  }>;
};

export default function manifest(): ExtendedManifest {
  return {
    id: "/",
    name: "Elysia",
    short_name: "Elysia",
    description: "תכשיטי Elysia עם מידע מוצר, שירות והזמנה מקוונת.",
    start_url: "/?source=pwa",
    scope: "/",
    lang: "he",
    dir: "rtl",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
    orientation: "portrait",
    categories: ["shopping", "lifestyle"],
    theme_color: "#101314",
    background_color: "#f7f7f4",
    icons: [
      {
        src: "/pwa/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/pwa/screenshots/mobile.webp",
        sizes: "390x844",
        type: "image/webp",
        form_factor: "narrow",
      },
      {
        src: "/pwa/screenshots/desktop.webp",
        sizes: "1440x900",
        type: "image/webp",
        form_factor: "wide",
      },
    ],
    shortcuts: [
      {
        name: "מבחר Elysia",
        short_name: "המבחר",
        description: "פתיחת מבחר Elysia",
        url: "/search?source=pwa-shortcut",
        icons: [
          {
            src: "/pwa/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      {
        name: "מתנות נבחרות",
        short_name: "מתנות",
        description: "פתיחת מדריך מתנות",
        url: "/gifts?source=pwa-shortcut",
        icons: [
          {
            src: "/pwa/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      {
        name: "מדריך מידות",
        short_name: "מידות",
        description: "שמירה מקומית להתאמה מהירה",
        url: "/size-guide?source=pwa-shortcut",
        icons: [
          {
            src: "/pwa/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      {
        name: "שירות",
        short_name: "שירות",
        description: "פנייה לשירות",
        url: "/service?source=pwa-shortcut",
        icons: [
          {
            src: "/pwa/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
    ],
  };
}
