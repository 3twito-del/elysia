import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import {
  createAdminCoupon,
  createAdminCouponInputSchema,
  createAdminProduct,
  createAdminProductInputSchema,
  refundAdminOrder,
  refundAdminOrderInputSchema,
  getAdminOrderDetail,
  listAdminAppointments,
  listAdminCatalog,
  listAdminCustomers,
  updateAdminAppointmentStatus,
  updateAdminAppointmentStatusInputSchema,
  updateAdminCouponStatus,
  updateAdminCouponStatusInputSchema,
  updateAdminInventory,
  updateAdminInventoryInputSchema,
  updateAdminProductStatus,
  updateAdminProductStatusInputSchema,
  upsertAdminShipment,
  upsertAdminShipmentInputSchema,
} from "~/server/services/admin-commerce";
import {
  adminOrderStatusSchema,
  getAdminOverview,
  listAdminOrders,
  updateManualOrderStatus,
} from "~/server/services/manual-order";
import { z } from "zod";

export const adminRouter = createTRPCRouter({
  overview: adminProcedure("ORDERS_READ").query(() => getAdminOverview()),

  orders: adminProcedure("ORDERS_READ")
    .input(z.object({ limit: z.number().int().positive().max(50).default(20) }))
    .query(({ input }) => listAdminOrders(input)),

  updateOrderStatus: adminProcedure("ORDERS_WRITE")
    .input(
      z.object({
        orderId: z.string().min(1),
        status: adminOrderStatusSchema,
      }),
    )
    .mutation(({ ctx, input }) =>
      updateManualOrderStatus({ ...input, adminUserId: ctx.admin.id }),
    ),

  upsertShipment: adminProcedure("ORDERS_WRITE")
    .input(upsertAdminShipmentInputSchema)
    .mutation(({ ctx, input }) =>
      upsertAdminShipment({ data: input, adminUserId: ctx.admin.id }),
    ),

  refundOrder: adminProcedure("ORDERS_REFUND")
    .input(refundAdminOrderInputSchema)
    .mutation(({ ctx, input }) =>
      refundAdminOrder({ data: input, adminUserId: ctx.admin.id }),
    ),

  catalog: adminProcedure("CATALOG_READ").query(() => listAdminCatalog()),

  createProduct: adminProcedure("CATALOG_WRITE")
    .input(createAdminProductInputSchema)
    .mutation(({ ctx, input }) =>
      createAdminProduct({ data: input, adminUserId: ctx.admin.id }),
    ),

  updateProductStatus: adminProcedure("CATALOG_WRITE")
    .input(updateAdminProductStatusInputSchema)
    .mutation(({ ctx, input }) =>
      updateAdminProductStatus({ data: input, adminUserId: ctx.admin.id }),
    ),

  updateInventory: adminProcedure("INVENTORY_WRITE")
    .input(updateAdminInventoryInputSchema)
    .mutation(({ ctx, input }) =>
      updateAdminInventory({ data: input, adminUserId: ctx.admin.id }),
    ),

  createCoupon: adminProcedure("CATALOG_WRITE")
    .input(createAdminCouponInputSchema)
    .mutation(({ ctx, input }) =>
      createAdminCoupon({ data: input, adminUserId: ctx.admin.id }),
    ),

  updateCouponStatus: adminProcedure("CATALOG_WRITE")
    .input(updateAdminCouponStatusInputSchema)
    .mutation(({ ctx, input }) =>
      updateAdminCouponStatus({ data: input, adminUserId: ctx.admin.id }),
    ),

  customers: adminProcedure("CUSTOMER_VIEW")
    .input(
      z.object({ limit: z.number().int().positive().max(100).default(50) }),
    )
    .query(({ input }) => listAdminCustomers(input)),

  appointments: adminProcedure("CUSTOMER_VIEW")
    .input(
      z.object({ limit: z.number().int().positive().max(100).default(25) }),
    )
    .query(({ input }) => listAdminAppointments(input)),

  updateAppointmentStatus: adminProcedure("CUSTOMER_WRITE")
    .input(updateAdminAppointmentStatusInputSchema)
    .mutation(({ ctx, input }) =>
      updateAdminAppointmentStatus({ data: input, adminUserId: ctx.admin.id }),
    ),

  orderDetail: adminProcedure("ORDERS_READ")
    .input(z.object({ orderId: z.string().min(1) }))
    .query(({ input }) => getAdminOrderDetail(input.orderId)),
});
