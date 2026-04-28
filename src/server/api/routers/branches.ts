import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { getCatalogBranches } from "~/server/services/catalog";

export const branchesRouter = createTRPCRouter({
  list: publicProcedure.query(() => getCatalogBranches()),
});
