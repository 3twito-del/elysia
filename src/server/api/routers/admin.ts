import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import {
  adminOrderStatusSchema,
  getAdminOverview,
  listAdminOrders,
  updateManualOrderStatus,
} from "~/server/services/manual-order";
import { z } from "zod";

export const adminRouter = createTRPCRouter({
  overview: adminProcedure("ORDERS").query(() => getAdminOverview()),

  orders: adminProcedure("ORDERS")
    .input(z.object({ limit: z.number().int().positive().max(50).default(20) }))
    .query(({ input }) => listAdminOrders(input)),

  updateOrderStatus: adminProcedure("ORDERS")
    .input(
      z.object({
        orderId: z.string().min(1),
        status: adminOrderStatusSchema,
      }),
    )
    .mutation(({ ctx, input }) =>
      updateManualOrderStatus({ ...input, adminUserId: ctx.admin.id }),
    ),
});
