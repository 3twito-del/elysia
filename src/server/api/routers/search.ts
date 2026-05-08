import { z } from "zod";

import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { searchProvider } from "~/server/adapters/search";

const optionalSearchString = z.string().trim().max(160).optional();

export const searchRouter = createTRPCRouter({
  products: publicProcedure
    .input(
      z.object({
        query: optionalSearchString,
        category: optionalSearchString,
        branch: optionalSearchString,
        material: optionalSearchString,
        stone: optionalSearchString,
        collection: optionalSearchString,
        maxPrice: z.number().positive().max(1_000_000).optional(),
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
