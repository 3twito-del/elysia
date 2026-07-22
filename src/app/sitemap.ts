import type { MetadataRoute } from "next";

import { env } from "~/env";
import {
  getCatalogCategories,
  listCatalogProducts,
} from "~/server/services/catalog";
import { listSitemapBlogPosts } from "~/server/services/blog";

const siteUrl = env.SITE_URL ?? "https://elysia-jewellery.com";

const staticRoutes = [
  "/",
  "/search",
  "/wishlist",
  "/service",
  "/blog",
  "/elys-ai",
  "/about",
  "/faq",
  "/size-guide",
  "/terms",
  "/privacy",
  "/accessibility",
  "/shipping-returns",
  "/warranty",
  "/jewellery-care",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products, blogPosts] = await Promise.all([
    getCatalogCategories(),
    listCatalogProducts(),
    listSitemapBlogPosts(),
  ]);

  return [
    ...staticRoutes.map((path) => ({
      changeFrequency: "weekly" as const,
      lastModified: new Date(),
      priority: path === "/" ? 1 : 0.7,
      url: createAbsoluteUrl(path),
    })),
    ...categories.map((category) => ({
      changeFrequency: "daily" as const,
      lastModified: new Date(),
      priority: 0.8,
      url: createAbsoluteUrl(`/category/${category.slug}`),
    })),
    ...products.map((product) => ({
      changeFrequency: "weekly" as const,
      lastModified: product.createdAt,
      priority: 0.6,
      url: createAbsoluteUrl(`/product/${product.slug}`),
    })),
    ...blogPosts.map((post) => ({
      changeFrequency: "weekly" as const,
      lastModified: post.updatedAt,
      priority: 0.5,
      url: createAbsoluteUrl(`/blog/${post.slug}`),
    })),
  ];
}

function createAbsoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}
