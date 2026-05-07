import { z } from "zod";

import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { searchProvider } from "~/server/adapters/search";

export const searchRouter = createTRPCRouter({
  products: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
        category: z.string().optional(),
        branch: z.string().optional(),
        material: z.string().optional(),
        stone: z.string().optional(),
        collection: z.string().optional(),
        maxPrice: z.number().optional(),
        availableOnly: z.boolean().optional(),
        page: z.number().int().positive().optional(),
        perPage: z.number().int().positive().max(48).optional(),
        sort: z
          .enum(["relevance", "price-asc", "price-desc", "newest", "popular"])
          .optional(),
      }),
    )
    .query(({ input }) => searchProvider.searchProducts(input)),

  reindex: adminProcedure("CATALOG_WRITE").mutation(() =>
    searchProvider.indexProducts(),
  ),
});
