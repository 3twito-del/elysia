import { z } from "zod";

import {
  categories,
  getAvailability,
  getFeaturedProducts,
  getProductBySlug,
  getProductsByCategory,
  products,
} from "~/lib/catalog";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const catalogRouter = createTRPCRouter({
  categories: publicProcedure.query(() => categories),

  featured: publicProcedure.query(() => getFeaturedProducts()),

  list: publicProcedure
    .input(z.object({ category: z.string().optional() }).optional())
    .query(({ input }) => getProductsByCategory(input?.category)),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ input }) => {
      const product = getProductBySlug(input.slug);

      if (!product) return null;

      return {
        ...product,
        availability: getAvailability(product),
      };
    }),

  facets: publicProcedure.query(() => ({
    materials: [...new Set(products.map((product) => product.material))],
    stones: [
      ...new Set(products.map((product) => product.stone).filter(Boolean)),
    ],
    collections: [...new Set(products.map((product) => product.collection))],
    priceRange: {
      min: Math.min(...products.map((product) => product.price)),
      max: Math.max(...products.map((product) => product.price)),
    },
  })),
});
