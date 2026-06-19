import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
  getCatalogBranches,
  getCatalogBranchAvailability,
  getCatalogCategories,
  getCatalogFacets,
  getCatalogProductBySlug,
  getFeaturedCatalogProducts,
  listCatalogProducts,
} from "~/server/services/catalog";

export const catalogRouter = createTRPCRouter({
  categories: publicProcedure.query(() => getCatalogCategories()),

  branches: publicProcedure.query(() => getCatalogBranches()),

  featured: publicProcedure.query(() => getFeaturedCatalogProducts()),

  list: publicProcedure
    .input(
      z.object({ category: z.string().trim().max(80).optional() }).optional(),
    )
    .query(({ input }) => listCatalogProducts({ category: input?.category })),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const [product, branches] = await Promise.all([
        getCatalogProductBySlug(input.slug),
        getCatalogBranches(),
      ]);

      if (!product) return null;

      return {
        ...product,
        availability: getCatalogBranchAvailability({ product, branches }),
      };
    }),

  bySlugs: publicProcedure
    .input(z.object({ slugs: z.array(z.string().trim().min(1)).max(24) }))
    .query(async ({ input }) => {
      if (input.slugs.length === 0) return [];

      const products = await listCatalogProducts();
      const bySlug = new Map(
        products.map((product) => [product.slug, product]),
      );

      return input.slugs
        .map((slug) => bySlug.get(slug))
        .filter((product): product is (typeof products)[number] =>
          Boolean(product),
        );
    }),

  facets: publicProcedure.query(() => getCatalogFacets()),
});
