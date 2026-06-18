import type { MetadataRoute } from "next";

import { env } from "~/env";

const siteUrl = env.SITE_URL ?? "https://elysia-jewellery.com";

export default function robots(): MetadataRoute.Robots {
  return {
    host: siteUrl,
    sitemap: `${siteUrl}/sitemap.xml`,
    rules: [
      {
        disallow: "/",
        userAgent: "*",
      },
    ],
  };
}
