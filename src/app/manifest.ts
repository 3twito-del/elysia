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
    description: "תכשיטי Elysia ללוק יומי, למתנה ולערב.",
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
        name: "תכשיטי Elysia",
        short_name: "תכשיטים",
        description: "פתיחת כל התכשיטים",
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
        name: "רעיונות למתנה",
        short_name: "מתנות",
        description: "פתיחת רעיונות למתנה",
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
        description: "בדיקת מידה לפני הזמנה",
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
        description: "שאלה לשירות",
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
