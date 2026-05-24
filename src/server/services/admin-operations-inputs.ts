import type {
  AppointmentStatus,
  FulfillmentMethod,
  OrderStatus,
  Prisma,
  ProductStatus,
} from "@prisma/client";
import { z } from "zod";

const orderStatuses = [
  "PENDING_PAYMENT",
  "PAID",
  "PREPARING",
  "READY_FOR_PICKUP",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
] as const satisfies readonly OrderStatus[];

const productStatuses = [
  "DRAFT",
  "ACTIVE",
  "ARCHIVED",
] as const satisfies readonly ProductStatus[];

const appointmentStatuses = [
  "REQUESTED",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
] as const satisfies readonly AppointmentStatus[];

const fulfillmentMethods = [
  "DELIVERY",
  "PICKUP",
] as const satisfies readonly FulfillmentMethod[];

const pageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  query: z.string().trim().max(160).optional(),
});

export const adminOrderListInputSchema = pageQuerySchema.extend({
  branchId: z.string().trim().min(1).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  fulfillmentMethod: z.enum(fulfillmentMethods).optional(),
  sort: z
    .enum(["created-desc", "created-asc", "total-desc", "total-asc"])
    .default("created-desc"),
  status: z.enum(orderStatuses).optional(),
});

export const adminCatalogListInputSchema = pageQuerySchema.extend({
  categoryId: z.string().trim().min(1).optional(),
  sort: z
    .enum(["updated-desc", "name-asc", "price-desc", "price-asc"])
    .default("updated-desc"),
  status: z.enum(productStatuses).optional(),
});

export const adminInventoryListInputSchema = pageQuerySchema.extend({
  branchId: z.string().trim().min(1).optional(),
  sort: z
    .enum(["updated-desc", "available-asc", "available-desc"])
    .default("updated-desc"),
});

export const adminCustomerListInputSchema = pageQuerySchema.extend({
  sort: z
    .enum(["updated-desc", "orders-desc", "ltv-desc"])
    .default("updated-desc"),
});

export const adminAppointmentListInputSchema = pageQuerySchema.extend({
  branchId: z.string().trim().min(1).optional(),
  sort: z.enum(["starts-asc", "starts-desc"]).default("starts-asc"),
  status: z.enum(appointmentStatuses).optional(),
});

export const adminAuditListInputSchema = pageQuerySchema.extend({
  entity: z.string().trim().max(80).optional(),
  sort: z.enum(["created-desc", "created-asc"]).default("created-desc"),
});

export const adminOutboxListInputSchema = pageQuerySchema.extend({
  status: z
    .enum(["PENDING", "PUBLISHED", "PROCESSING", "PROCESSED", "FAILED"])
    .optional(),
  type: z.string().trim().max(120).optional(),
});

export const adminJobRunListInputSchema = pageQuerySchema.extend({
  status: z.enum(["RUNNING", "COMPLETED", "FAILED", "SKIPPED"]).optional(),
});

export type AdminOrderListInput = z.infer<typeof adminOrderListInputSchema>;
export type AdminCatalogListInput = z.infer<typeof adminCatalogListInputSchema>;
export type AdminInventoryListInput = z.infer<
  typeof adminInventoryListInputSchema
>;
export type AdminCustomerListInput = z.infer<
  typeof adminCustomerListInputSchema
>;
export type AdminAppointmentListInput = z.infer<
  typeof adminAppointmentListInputSchema
>;
export type AdminAuditListInput = z.infer<typeof adminAuditListInputSchema>;
export type AdminOutboxListInput = z.infer<typeof adminOutboxListInputSchema>;
export type AdminJobRunListInput = z.infer<typeof adminJobRunListInputSchema>;

export type AdminPageInfo = {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export function createAdminPageInfo(input: {
  page: number;
  pageSize: number;
  totalItems: number;
}): AdminPageInfo {
  const totalPages = Math.max(1, Math.ceil(input.totalItems / input.pageSize));
  const page = Math.min(input.page, totalPages);

  return {
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    page,
    pageSize: input.pageSize,
    totalItems: input.totalItems,
    totalPages,
  };
}

export function getAdminSkip(input: { page: number; pageSize: number }) {
  return (input.page - 1) * input.pageSize;
}

export function getAdminOrderSort(
  sort: AdminOrderListInput["sort"],
): Prisma.OrderOrderByWithRelationInput {
  if (sort === "created-asc") return { createdAt: "asc" };
  if (sort === "total-desc") return { total: "desc" };
  if (sort === "total-asc") return { total: "asc" };

  return { createdAt: "desc" };
}

export function getAdminCatalogSort(
  sort: AdminCatalogListInput["sort"],
): Prisma.ProductOrderByWithRelationInput {
  if (sort === "name-asc") return { name: "asc" };
  if (sort === "price-desc") return { basePrice: "desc" };
  if (sort === "price-asc") return { basePrice: "asc" };

  return { updatedAt: "desc" };
}
