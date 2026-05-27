import type { MetadataRoute } from "next";

import { env } from "~/env";

const siteUrl = env.SITE_URL ?? "https://elysia-jewellery.com";

export default function robots(): MetadataRoute.Robots {
  return {
    host: siteUrl,
    rules: [
      {
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/account/orders/",
          "/account/privacy/export",
          "/offline",
        ],
        userAgent: "*",
      },
    ],
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
