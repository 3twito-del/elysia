import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import {
  createAdminCoupon,
  createAdminCouponInputSchema,
  createAdminProduct,
  createAdminProductInputSchema,
  refundAdminOrder,
  refundAdminOrderInputSchema,
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
  adminAppointmentListInputSchema,
  adminAuditListInputSchema,
  adminCatalogListInputSchema,
  adminCustomerListInputSchema,
  adminInventoryListInputSchema,
  adminJobRunListInputSchema,
  adminOrderListInputSchema,
  adminOutboxListInputSchema,
  getAdminOperationsOverview,
  getAdminOrderDetail,
  listAdminAppointments,
  listAdminAuditLogs,
  listAdminCatalog,
  listAdminCustomers,
  listAdminInventory,
  listAdminJobRuns,
  listAdminOrders,
  listAdminOutboxEvents,
} from "~/server/services/admin-operations";
import {
  adminOrderStatusSchema,
  updateManualOrderStatus,
} from "~/server/services/manual-order";
import { z } from "zod";

export const adminRouter = createTRPCRouter({
  overview: adminProcedure("ORDERS_READ").query(() =>
    getAdminOperationsOverview(),
  ),

  orders: adminProcedure("ORDERS_READ")
    .input(adminOrderListInputSchema)
    .query(({ input }) => listAdminOrders(input)),

  updateOrderStatus: adminProcedure("ORDERS_WRITE")
    .input(
      z.object({
        orderId: z.string().trim().min(1).max(128),
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

  catalog: adminProcedure("CATALOG_READ")
    .input(adminCatalogListInputSchema)
    .query(({ input }) => listAdminCatalog(input)),

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
    .input(adminCustomerListInputSchema)
    .query(({ input }) => listAdminCustomers(input)),

  appointments: adminProcedure("CUSTOMER_VIEW")
    .input(adminAppointmentListInputSchema)
    .query(({ input }) => listAdminAppointments(input)),

  inventory: adminProcedure("INVENTORY_READ")
    .input(adminInventoryListInputSchema)
    .query(({ input }) => listAdminInventory(input)),

  audit: adminProcedure("SYSTEM_CONFIG")
    .input(adminAuditListInputSchema)
    .query(({ input }) => listAdminAuditLogs(input)),

  outbox: adminProcedure("SYSTEM_CONFIG")
    .input(adminOutboxListInputSchema)
    .query(({ input }) => listAdminOutboxEvents(input)),

  jobRuns: adminProcedure("SYSTEM_CONFIG")
    .input(adminJobRunListInputSchema)
    .query(({ input }) => listAdminJobRuns(input)),

  updateAppointmentStatus: adminProcedure("CUSTOMER_WRITE")
    .input(updateAdminAppointmentStatusInputSchema)
    .mutation(({ ctx, input }) =>
      updateAdminAppointmentStatus({ data: input, adminUserId: ctx.admin.id }),
    ),

  orderDetail: adminProcedure("ORDERS_READ")
    .input(z.object({ orderId: z.string().trim().min(1).max(128) }))
    .query(({ input }) => getAdminOrderDetail(input.orderId)),
});
