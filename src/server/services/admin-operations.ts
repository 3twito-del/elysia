import type {
  AppointmentStatus,
  FulfillmentMethod,
  OrderStatus,
  Prisma,
  ProductStatus,
} from "@prisma/client";
import { z } from "zod";

import { env } from "~/env";
import { notificationProvider } from "~/server/adapters/notifications";
import { db } from "~/server/db";
import { DEFAULT_CATALOG_IMAGE } from "~/server/services/catalog";

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

export type AdminPageInfo = {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type AdminIntegrationStatus =
  | "configured"
  | "degraded"
  | "local-fallback"
  | "missing-secret"
  | "rollout-required";

export type AdminIntegrationSummary = {
  capabilities: string[];
  detail: string;
  name: string;
  status: AdminIntegrationStatus;
};

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

export async function getAdminOperationsOverview() {
  const [
    products,
    activeProducts,
    branches,
    inventory,
    reserved,
    pendingAppointments,
    openOrders,
    failedOutbox,
    dueOutbox,
    latestOrders,
  ] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { status: "ACTIVE" } }),
    db.branch.count(),
    db.inventoryItem.aggregate({ _sum: { quantity: true } }),
    db.inventoryItem.aggregate({ _sum: { reserved: true } }),
    db.appointment.count({ where: { status: "REQUESTED" } }),
    db.order.count({
      where: {
        status: {
          in: ["PENDING_PAYMENT", "PAID", "PREPARING", "READY_FOR_PICKUP"],
        },
      },
    }),
    db.outboxEvent.count({ where: { status: "FAILED" } }),
    db.outboxEvent.count({
      where: {
        availableAt: { lte: new Date() },
        status: { in: ["PENDING", "FAILED"] },
      },
    }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { branch: true, payments: { take: 1 } },
    }),
  ]);

  return {
    activeProducts,
    branches,
    dueOutbox,
    failedOutbox,
    integrations: getAdminIntegrationStatuses(),
    inventoryReserved: reserved._sum.reserved ?? 0,
    inventoryUnits: inventory._sum.quantity ?? 0,
    latestOrders: latestOrders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      paymentStatus: order.payments[0]?.status ?? "PENDING",
      recipientName: order.recipientName,
      status: order.status,
      total: Number(order.total),
      branchName: order.branch?.name ?? null,
      createdAt: order.createdAt,
    })),
    openOrders,
    pendingAppointments,
    products,
  };
}

export async function listAdminOrders(
  input: z.infer<typeof adminOrderListInputSchema>,
) {
  const parsed = adminOrderListInputSchema.parse(input);
  const where: Prisma.OrderWhereInput = {
    ...(parsed.status ? { status: parsed.status } : {}),
    ...(parsed.branchId ? { branchId: parsed.branchId } : {}),
    ...(parsed.fulfillmentMethod
      ? { fulfillmentMethod: parsed.fulfillmentMethod }
      : {}),
    ...(parsed.dateFrom || parsed.dateTo
      ? {
          createdAt: {
            ...(parsed.dateFrom ? { gte: parsed.dateFrom } : {}),
            ...(parsed.dateTo ? { lte: parsed.dateTo } : {}),
          },
        }
      : {}),
    ...(parsed.query
      ? {
          OR: [
            { orderNumber: { contains: parsed.query, mode: "insensitive" } },
            { recipientName: { contains: parsed.query, mode: "insensitive" } },
            { email: { contains: parsed.query, mode: "insensitive" } },
            { phone: { contains: parsed.query, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const orderBy = getOrderSort(parsed.sort);
  const [totalItems, orders, branches] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy,
      skip: getAdminSkip(parsed),
      take: parsed.pageSize,
      include: {
        branch: true,
        customer: true,
        items: true,
        payments: true,
        returns: {
          orderBy: { createdAt: "desc" },
          take: 3,
        },
        shipments: {
          orderBy: { shippedAt: "desc" },
          take: 1,
        },
      },
    }),
    db.branch.findMany({ orderBy: [{ city: "asc" }, { name: "asc" }] }),
  ]);

  return {
    branches: branches.map((branch) => ({
      id: branch.id,
      city: branch.city,
      name: branch.name,
      slug: branch.slug,
    })),
    items: orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      fulfillmentMethod: order.fulfillmentMethod,
      total: Number(order.total),
      email: order.email,
      phone: order.phone,
      recipientName: order.recipientName,
      branchName: order.branch?.name ?? "ללא סניף",
      branchCity: order.branch?.city ?? "",
      createdAt: order.createdAt,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      paymentStatus: order.payments[0]?.status ?? "PENDING",
      returns: order.returns.map((request) => ({
        id: request.id,
        reason: request.reason,
        status: request.status,
        notes: request.notes,
        createdAt: request.createdAt,
      })),
      shipment: order.shipments[0]
        ? {
            id: order.shipments[0].id,
            provider: order.shipments[0].provider,
            tracking: order.shipments[0].tracking,
            status: order.shipments[0].status,
            shippedAt: order.shipments[0].shippedAt,
            deliveredAt: order.shipments[0].deliveredAt,
          }
        : null,
    })),
    pageInfo: createAdminPageInfo({
      page: parsed.page,
      pageSize: parsed.pageSize,
      totalItems,
    }),
    totals: await getOrderTotals(),
  };
}

export async function listAdminCatalog(
  input: z.infer<typeof adminCatalogListInputSchema>,
) {
  const parsed = adminCatalogListInputSchema.parse(input);
  const where: Prisma.ProductWhereInput = {
    ...(parsed.status ? { status: parsed.status } : {}),
    ...(parsed.categoryId ? { categoryId: parsed.categoryId } : {}),
    ...(parsed.query
      ? {
          OR: [
            { name: { contains: parsed.query, mode: "insensitive" } },
            { sku: { contains: parsed.query, mode: "insensitive" } },
            { slug: { contains: parsed.query, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [
    products,
    totalItems,
    categories,
    materials,
    stones,
    branches,
    coupons,
  ] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: getCatalogSort(parsed.sort),
      skip: getAdminSkip(parsed),
      take: parsed.pageSize,
      include: {
        category: true,
        material: true,
        stone: true,
        variants: {
          include: {
            inventoryItems: { include: { branch: true } },
            prices: {
              orderBy: { validFrom: "desc" },
              take: 1,
            },
          },
        },
        media: {
          where: { kind: "IMAGE" },
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          select: { url: true },
          take: 1,
        },
      },
    }),
    db.product.count({ where }),
    db.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    db.material.findMany({ orderBy: { name: "asc" } }),
    db.stone.findMany({ orderBy: { name: "asc" } }),
    db.branch.findMany({ orderBy: [{ city: "asc" }, { name: "asc" }] }),
    db.coupon.findMany({ orderBy: { startsAt: "desc" }, take: 20 }),
  ]);

  return {
    branches: branches.map((branch) => ({
      id: branch.id,
      slug: branch.slug,
      name: branch.name,
      city: branch.city,
    })),
    categories: categories.map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
    })),
    coupons: coupons.map((coupon) => ({
      id: coupon.id,
      code: coupon.code,
      description: coupon.description,
      percentOff: coupon.percentOff,
      amountOff: coupon.amountOff ? Number(coupon.amountOff) : null,
      startsAt: coupon.startsAt,
      endsAt: coupon.endsAt,
      maxUses: coupon.maxUses,
      usedCount: coupon.usedCount,
      isActive: coupon.isActive,
    })),
    materials: materials.map((material) => ({
      id: material.id,
      slug: material.slug,
      name: material.name,
    })),
    pageInfo: createAdminPageInfo({
      page: parsed.page,
      pageSize: parsed.pageSize,
      totalItems,
    }),
    products: products.map((product) => ({
      id: product.id,
      slug: product.slug,
      sku: product.sku,
      name: product.name,
      image: product.media[0]?.url ?? DEFAULT_CATALOG_IMAGE,
      status: product.status,
      categoryName: product.category.name,
      materialName: product.material.name,
      stoneName: product.stone?.name ?? null,
      basePrice: Number(product.basePrice),
      variants: product.variants.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        name: variant.name,
        price: Number(variant.prices[0]?.amount ?? product.basePrice),
        inventory: variant.inventoryItems.map((item) => ({
          branchId: item.branchId,
          branchName: item.branch.name,
          quantity: item.quantity,
          reserved: item.reserved,
          safetyStock: item.safetyStock,
        })),
      })),
    })),
    stones: stones.map((stone) => ({
      id: stone.id,
      slug: stone.slug,
      name: stone.name,
    })),
  };
}

export async function listAdminInventory(
  input: z.infer<typeof adminInventoryListInputSchema>,
) {
  const parsed = adminInventoryListInputSchema.parse(input);
  const where: Prisma.InventoryItemWhereInput = {
    ...(parsed.branchId ? { branchId: parsed.branchId } : {}),
    ...(parsed.query
      ? {
          OR: [
            {
              branch: {
                name: { contains: parsed.query, mode: "insensitive" },
              },
            },
            {
              variant: {
                sku: { contains: parsed.query, mode: "insensitive" },
              },
            },
            {
              variant: {
                product: {
                  name: { contains: parsed.query, mode: "insensitive" },
                },
              },
            },
          ],
        }
      : {}),
  };
  const [items, totalItems, branches] = await Promise.all([
    db.inventoryItem.findMany({
      where,
      orderBy:
        parsed.sort === "updated-desc"
          ? { updatedAt: "desc" }
          : { quantity: parsed.sort === "available-asc" ? "asc" : "desc" },
      skip: getAdminSkip(parsed),
      take: parsed.pageSize,
      include: {
        branch: true,
        variant: {
          include: {
            product: {
              include: {
                category: true,
                media: {
                  where: { kind: "IMAGE" },
                  orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
                  take: 1,
                },
              },
            },
          },
        },
      },
    }),
    db.inventoryItem.count({ where }),
    db.branch.findMany({ orderBy: [{ city: "asc" }, { name: "asc" }] }),
  ]);

  return {
    branches: branches.map((branch) => ({
      id: branch.id,
      city: branch.city,
      name: branch.name,
      slug: branch.slug,
    })),
    items: items.map((item) => ({
      id: item.id,
      branchId: item.branchId,
      branchName: item.branch.name,
      branchCity: item.branch.city,
      categoryName: item.variant.product.category.name,
      productName: item.variant.product.name,
      productSlug: item.variant.product.slug,
      productImage: item.variant.product.media[0]?.url ?? DEFAULT_CATALOG_IMAGE,
      quantity: item.quantity,
      reserved: item.reserved,
      safetyStock: item.safetyStock,
      sellable: Math.max(0, item.quantity - item.reserved - item.safetyStock),
      updatedAt: item.updatedAt,
      variant: {
        id: item.variant.id,
        sku: item.variant.sku,
        name: item.variant.name,
      },
    })),
    pageInfo: createAdminPageInfo({
      page: parsed.page,
      pageSize: parsed.pageSize,
      totalItems,
    }),
  };
}

export async function listAdminCustomers(
  input: z.infer<typeof adminCustomerListInputSchema>,
) {
  const parsed = adminCustomerListInputSchema.parse(input);
  const where: Prisma.CustomerWhereInput = parsed.query
    ? {
        OR: [
          { email: { contains: parsed.query, mode: "insensitive" } },
          { phone: { contains: parsed.query, mode: "insensitive" } },
          { firstName: { contains: parsed.query, mode: "insensitive" } },
          { lastName: { contains: parsed.query, mode: "insensitive" } },
        ],
      }
    : {};
  const [customers, totalItems] = await Promise.all([
    db.customer.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: getAdminSkip(parsed),
      take: parsed.pageSize,
      include: {
        orders: { select: { id: true, total: true, status: true } },
        wishlist: { include: { items: true } },
        addresses: true,
        appointments: true,
      },
    }),
    db.customer.count({ where }),
  ]);
  const items = customers
    .map((customer) => ({
      id: customer.id,
      email: customer.email,
      phone: customer.phone,
      name: [customer.firstName, customer.lastName].filter(Boolean).join(" "),
      orders: customer.orders.length,
      openOrders: customer.orders.filter((order) =>
        ["PENDING_PAYMENT", "PAID", "PREPARING", "READY_FOR_PICKUP"].includes(
          order.status,
        ),
      ).length,
      lifetimeValue: customer.orders.reduce(
        (sum, order) => sum + Number(order.total),
        0,
      ),
      wishlistItems: customer.wishlist?.items.length ?? 0,
      addresses: customer.addresses.length,
      appointments: customer.appointments.length,
      updatedAt: customer.updatedAt,
    }))
    .sort((first, second) => {
      if (parsed.sort === "orders-desc") return second.orders - first.orders;
      if (parsed.sort === "ltv-desc") {
        return second.lifetimeValue - first.lifetimeValue;
      }

      return 0;
    });

  return {
    items,
    pageInfo: createAdminPageInfo({
      page: parsed.page,
      pageSize: parsed.pageSize,
      totalItems,
    }),
  };
}

export async function listAdminAppointments(
  input: z.infer<typeof adminAppointmentListInputSchema>,
) {
  const parsed = adminAppointmentListInputSchema.parse(input);
  const where: Prisma.AppointmentWhereInput = {
    ...(parsed.status ? { status: parsed.status } : {}),
    ...(parsed.branchId ? { branchId: parsed.branchId } : {}),
    ...(parsed.query
      ? {
          OR: [
            { name: { contains: parsed.query, mode: "insensitive" } },
            { email: { contains: parsed.query, mode: "insensitive" } },
            { phone: { contains: parsed.query, mode: "insensitive" } },
            { topic: { contains: parsed.query, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [appointments, totalItems, branches] = await Promise.all([
    db.appointment.findMany({
      where,
      orderBy: { startsAt: parsed.sort === "starts-asc" ? "asc" : "desc" },
      skip: getAdminSkip(parsed),
      take: parsed.pageSize,
      include: {
        branch: true,
        customer: true,
      },
    }),
    db.appointment.count({ where }),
    db.branch.findMany({ orderBy: [{ city: "asc" }, { name: "asc" }] }),
  ]);

  return {
    branches: branches.map((branch) => ({
      id: branch.id,
      city: branch.city,
      name: branch.name,
      slug: branch.slug,
    })),
    items: appointments.map((appointment) => ({
      id: appointment.id,
      topic: appointment.topic,
      name: appointment.name,
      email: appointment.email,
      phone: appointment.phone,
      startsAt: appointment.startsAt,
      status: appointment.status,
      notes: appointment.notes,
      branchName: appointment.branch.name,
      branchCity: appointment.branch.city,
      customerId: appointment.customerId,
    })),
    pageInfo: createAdminPageInfo({
      page: parsed.page,
      pageSize: parsed.pageSize,
      totalItems,
    }),
  };
}

export async function getAdminOrderDetail(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      branch: true,
      customer: true,
      items: true,
      payments: true,
      returns: {
        orderBy: { createdAt: "desc" },
      },
      shipments: {
        orderBy: { shippedAt: "desc" },
      },
    },
  });

  if (!order) return null;

  const [reservations, auditLogs, outboxEvents, inventoryLedgers] =
    await Promise.all([
      db.inventoryReservation.findMany({
        where: { orderId },
        orderBy: { createdAt: "desc" },
      }),
      db.auditLog.findMany({
        where: { entity: "Order", entityId: orderId },
        orderBy: { createdAt: "desc" },
        include: { adminUser: true },
        take: 20,
      }),
      db.outboxEvent.findMany({
        where: { aggregateType: "Order", aggregateId: orderId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      db.inventoryLedger.findMany({
        where: { reference: order.orderNumber },
        orderBy: { createdAt: "desc" },
        include: {
          branch: true,
          variant: true,
        },
        take: 20,
      }),
    ]);

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    fulfillmentMethod: order.fulfillmentMethod,
    totals: {
      subtotal: Number(order.subtotal),
      discount: Number(order.discountTotal),
      shipping: Number(order.shippingTotal),
      total: Number(order.total),
    },
    customer: {
      id: order.customerId,
      email: order.email,
      phone: order.phone,
      name: order.recipientName,
    },
    branch: order.branch
      ? {
          id: order.branch.id,
          name: order.branch.name,
          city: order.branch.city,
          phone: order.branch.phone,
        }
      : null,
    items: order.items.map((item) => ({
      id: item.id,
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
    })),
    payments: order.payments.map((payment) => ({
      id: payment.id,
      provider: payment.provider,
      status: payment.status,
      providerStatus: payment.providerStatus,
      failureCode: payment.failureCode,
      amount: Number(payment.amount),
      capturedAt: payment.capturedAt,
      refundedAt: payment.refundedAt,
    })),
    reservations: reservations.map((reservation) => ({
      id: reservation.id,
      branchId: reservation.branchId,
      variantId: reservation.variantId,
      quantity: reservation.quantity,
      expiresAt: reservation.expiresAt,
      releasedAt: reservation.releasedAt,
      createdAt: reservation.createdAt,
    })),
    shipments: order.shipments,
    returns: order.returns,
    timeline: createOrderTimeline(order),
    auditLogs: auditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      metadata: log.metadata,
      adminName: log.adminUser?.name ?? "System",
      createdAt: log.createdAt,
    })),
    outboxEvents: outboxEvents.map((event) => ({
      id: event.id,
      type: event.type,
      status: event.status,
      attempts: event.attempts,
      lastError: event.lastError,
      createdAt: event.createdAt,
      availableAt: event.availableAt,
      processedAt: event.processedAt,
    })),
    inventoryLedgers: inventoryLedgers.map((entry) => ({
      id: entry.id,
      branchName: entry.branch.name,
      variantSku: entry.variant.sku,
      delta: entry.delta,
      reason: entry.reason,
      createdAt: entry.createdAt,
    })),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export async function listAdminAuditLogs(
  input: z.infer<typeof adminAuditListInputSchema>,
) {
  const parsed = adminAuditListInputSchema.parse(input);
  const where: Prisma.AuditLogWhereInput = {
    ...(parsed.entity ? { entity: parsed.entity } : {}),
    ...(parsed.query
      ? {
          OR: [
            { action: { contains: parsed.query, mode: "insensitive" } },
            { entity: { contains: parsed.query, mode: "insensitive" } },
            { entityId: { contains: parsed.query, mode: "insensitive" } },
            {
              adminUser: {
                email: { contains: parsed.query, mode: "insensitive" },
              },
            },
          ],
        }
      : {}),
  };
  const [logs, totalItems] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: parsed.sort === "created-asc" ? "asc" : "desc" },
      skip: getAdminSkip(parsed),
      take: parsed.pageSize,
      include: { adminUser: true },
    }),
    db.auditLog.count({ where }),
  ]);

  return {
    items: logs.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      metadata: log.metadata,
      adminName: log.adminUser?.name ?? "System",
      adminEmail: log.adminUser?.email ?? null,
      createdAt: log.createdAt,
    })),
    pageInfo: createAdminPageInfo({
      page: parsed.page,
      pageSize: parsed.pageSize,
      totalItems,
    }),
  };
}

export async function listAdminOutboxEvents(
  input: z.infer<typeof adminOutboxListInputSchema>,
) {
  const parsed = adminOutboxListInputSchema.parse(input);
  const where: Prisma.OutboxEventWhereInput = {
    ...(parsed.status ? { status: parsed.status } : {}),
    ...(parsed.type ? { type: parsed.type } : {}),
    ...(parsed.query
      ? {
          OR: [
            { type: { contains: parsed.query, mode: "insensitive" } },
            { aggregateId: { contains: parsed.query, mode: "insensitive" } },
            { aggregateType: { contains: parsed.query, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [events, totalItems] = await Promise.all([
    db.outboxEvent.findMany({
      where,
      orderBy: [{ availableAt: "asc" }, { createdAt: "desc" }],
      skip: getAdminSkip(parsed),
      take: parsed.pageSize,
    }),
    db.outboxEvent.count({ where }),
  ]);

  return {
    items: events.map((event) => ({
      id: event.id,
      type: event.type,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      status: event.status,
      attempts: event.attempts,
      lastError: event.lastError,
      availableAt: event.availableAt,
      createdAt: event.createdAt,
      processedAt: event.processedAt,
    })),
    pageInfo: createAdminPageInfo({
      page: parsed.page,
      pageSize: parsed.pageSize,
      totalItems,
    }),
  };
}

export async function listAdminJobRuns(
  input: z.infer<typeof adminJobRunListInputSchema>,
) {
  const parsed = adminJobRunListInputSchema.parse(input);
  const where: Prisma.JobRunWhereInput = {
    ...(parsed.status ? { status: parsed.status } : {}),
    ...(parsed.query
      ? { name: { contains: parsed.query, mode: "insensitive" } }
      : {}),
  };
  const [jobs, totalItems] = await Promise.all([
    db.jobRun.findMany({
      where,
      orderBy: { startedAt: "desc" },
      skip: getAdminSkip(parsed),
      take: parsed.pageSize,
    }),
    db.jobRun.count({ where }),
  ]);

  return {
    items: jobs.map((job) => ({
      id: job.id,
      name: job.name,
      status: job.status,
      attempts: job.attempts,
      lastError: job.lastError,
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
      outboxEventId: job.outboxEventId,
    })),
    pageInfo: createAdminPageInfo({
      page: parsed.page,
      pageSize: parsed.pageSize,
      totalItems,
    }),
  };
}

export function getAdminIntegrationStatuses(): AdminIntegrationSummary[] {
  return [
    createIntegrationSummary({
      configured: Boolean(
        env.CARD_COM_TERMINAL &&
        env.CARD_COM_API_NAME &&
        env.CARD_COM_API_PASSWORD,
      ),
      fallback: env.NODE_ENV !== "production",
      capabilities: ["checkout", "capture", "webhook"],
      configuredDetail: "CardCom credentials are present.",
      fallbackDetail: "Manual payment workflow is active for local operations.",
      missingDetail:
        "CardCom terminal, API name, and API password are missing.",
      name: "CardCom payments",
    }),
    createIntegrationSummary({
      configured: notificationProvider.isOperational(),
      fallback: env.NODE_ENV !== "production",
      capabilities: ["transactional-email", "retry-safe-outbox"],
      configuredDetail: `${notificationProvider.providerName()} email is configured.`,
      fallbackDetail: "Email delivery is using local/mock fallback behavior.",
      missingDetail: "Configure Resend or Brevo plus sender/operations emails.",
      name: "Transactional email",
    }),
    createIntegrationSummary({
      configured: Boolean(env.TYPESENSE_HOST && env.TYPESENSE_API_KEY),
      fallback: env.NODE_ENV !== "production",
      capabilities: ["search", "facets", "reindex"],
      configuredDetail: "Typesense host and API key are configured.",
      fallbackDetail: "Local catalog search fallback is active.",
      missingDetail: "Typesense host and API key are required in production.",
      name: "Typesense search",
    }),
    createIntegrationSummary({
      configured: Boolean(env.JOB_RUNNER_SECRET ?? env.CRON_SECRET),
      fallback: env.NODE_ENV !== "production",
      capabilities: ["outbox", "reservation-expiry", "retry"],
      configuredDetail: "Job runner endpoint is protected by a bearer secret.",
      fallbackDetail: "Local job runner is open for development.",
      missingDetail: "JOB_RUNNER_SECRET or CRON_SECRET is required.",
      name: "Outbox jobs",
    }),
    {
      capabilities: ["waf", "rate-limits", "observability"],
      detail: hasVercelCredentials()
        ? "Vercel-linked credentials are present; production policies still require rollout."
        : "Code is ready for platform policy rollout when Vercel access is available.",
      name: "Vercel platform controls",
      status: hasVercelCredentials() ? "degraded" : "rollout-required",
    },
  ];
}

function hasVercelCredentials() {
  return Boolean(env.VERCEL_OIDC_TOKEN ?? env.AI_GATEWAY_API_KEY);
}

export function createIntegrationSummary(input: {
  capabilities: string[];
  configured: boolean;
  configuredDetail: string;
  fallback: boolean;
  fallbackDetail: string;
  missingDetail: string;
  name: string;
}): AdminIntegrationSummary {
  if (input.configured) {
    return {
      capabilities: input.capabilities,
      detail: input.configuredDetail,
      name: input.name,
      status: "configured",
    };
  }

  if (input.fallback) {
    return {
      capabilities: input.capabilities,
      detail: input.fallbackDetail,
      name: input.name,
      status: "local-fallback",
    };
  }

  return {
    capabilities: input.capabilities,
    detail: input.missingDetail,
    name: input.name,
    status: "missing-secret",
  };
}

function getOrderSort(
  sort: z.infer<typeof adminOrderListInputSchema>["sort"],
): Prisma.OrderOrderByWithRelationInput {
  if (sort === "created-asc") return { createdAt: "asc" };
  if (sort === "total-desc") return { total: "desc" };
  if (sort === "total-asc") return { total: "asc" };

  return { createdAt: "desc" };
}

function getCatalogSort(
  sort: z.infer<typeof adminCatalogListInputSchema>["sort"],
): Prisma.ProductOrderByWithRelationInput {
  if (sort === "name-asc") return { name: "asc" };
  if (sort === "price-desc") return { basePrice: "desc" };
  if (sort === "price-asc") return { basePrice: "asc" };

  return { updatedAt: "desc" };
}

async function getOrderTotals() {
  const counts = await db.order.groupBy({
    by: ["status"],
    _count: true,
  });

  return Object.fromEntries(
    counts.map((count) => [count.status, count._count]),
  ) as Partial<Record<OrderStatus, number>>;
}

function createOrderTimeline(order: {
  cancelledAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  paidAt: Date | null;
  preparingAt: Date | null;
  readyForPickupAt: Date | null;
  refundedAt: Date | null;
  shippedAt: Date | null;
}) {
  return [
    { label: "נוצרה", at: order.createdAt },
    { label: "שולמה", at: order.paidAt },
    { label: "בהכנה", at: order.preparingAt },
    { label: "מוכן לאיסוף", at: order.readyForPickupAt },
    { label: "נשלחה", at: order.shippedAt },
    { label: "הושלמה", at: order.completedAt },
    { label: "בוטלה", at: order.cancelledAt },
    { label: "זוכתה", at: order.refundedAt },
  ].filter((event): event is { label: string; at: Date } => Boolean(event.at));
}
