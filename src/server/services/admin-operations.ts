import type { OrderStatus, Prisma } from "@prisma/client";

import { env } from "~/env";
import {
  getOrderSourceDescription,
  getOrderSourceLabel,
  getShopifyFinancialStatusLabel,
  getShopifyFulfillmentStatusLabel,
} from "~/lib/commerce-labels";
import { notificationProvider } from "~/server/adapters/notifications";
import { getShopifyAdminOrderUrl } from "~/server/adapters/shopify";
import { db } from "~/server/db";
import { DEFAULT_CATALOG_IMAGE } from "~/server/services/catalog";
import {
  createProductionIntegrationSummaries,
  type AdminIntegrationSummary,
} from "~/server/services/admin-integrations";
import {
  adminAppointmentListInputSchema,
  adminAuditListInputSchema,
  adminCatalogListInputSchema,
  adminCustomerListInputSchema,
  adminInventoryListInputSchema,
  adminJobRunListInputSchema,
  adminOrderListInputSchema,
  adminOutboxListInputSchema,
  createAdminPageInfo,
  getAdminCatalogSort,
  getAdminOrderSort,
  getAdminSkip,
  type AdminAppointmentListInput,
  type AdminAuditListInput,
  type AdminCatalogListInput,
  type AdminCustomerListInput,
  type AdminInventoryListInput,
  type AdminJobRunListInput,
  type AdminOrderListInput,
  type AdminOutboxListInput,
  type AdminPageInfo,
} from "~/server/services/admin-operations-inputs";

export {
  createIntegrationSummary,
  createProductionIntegrationSummaries,
} from "~/server/services/admin-integrations";
export type {
  AdminIntegrationStatus,
  AdminIntegrationSummary,
  ProductionIntegrationConfig,
} from "~/server/services/admin-integrations";
export {
  adminAppointmentListInputSchema,
  adminAuditListInputSchema,
  adminCatalogListInputSchema,
  adminCustomerListInputSchema,
  adminInventoryListInputSchema,
  adminJobRunListInputSchema,
  adminOrderListInputSchema,
  adminOutboxListInputSchema,
  createAdminPageInfo,
  getAdminSkip,
};
export type { AdminPageInfo };

async function getAdminServiceSettings() {
  return db.serviceSettings.findUnique({ where: { id: "default" } });
}

function getAdminBranchWhere(
  physicalBranchesEnabled: boolean,
): Prisma.BranchWhereInput {
  return physicalBranchesEnabled
    ? { isActive: true }
    : { kind: "ONLINE" as const, isActive: true };
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
    serviceSettings,
  ] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { status: "ACTIVE" } }),
    db.branch.count({ where: { kind: "PHYSICAL" } }),
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
    getAdminServiceSettings(),
  ]);
  const physicalBranchesEnabled =
    serviceSettings?.physicalBranchesEnabled ?? false;

  return {
    activeProducts,
    branches: physicalBranchesEnabled ? branches : 0,
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
      branchName: physicalBranchesEnabled
        ? (order.branch?.name ?? null)
        : "שירות מרחוק",
      createdAt: order.createdAt,
    })),
    openOrders,
    pendingAppointments,
    products,
  };
}

export async function listAdminOrders(input: AdminOrderListInput) {
  const parsed = adminOrderListInputSchema.parse(input);
  const serviceSettings = await getAdminServiceSettings();
  const physicalBranchesEnabled =
    serviceSettings?.physicalBranchesEnabled ?? false;
  const where: Prisma.OrderWhereInput = {
    ...(parsed.status ? { status: parsed.status } : {}),
    ...(physicalBranchesEnabled && parsed.branchId
      ? { branchId: parsed.branchId }
      : {}),
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
  const orderBy = getAdminOrderSort(parsed.sort);
  const localOnlyOrderFiltersActive = [
    Boolean(parsed.status),
    Boolean(parsed.fulfillmentMethod),
    physicalBranchesEnabled && Boolean(parsed.branchId),
  ].some(Boolean);
  const shopifyMirrorWhere: Prisma.ShopifyOrderMirrorWhereInput = {
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
            {
              shopifyOrderId: {
                contains: parsed.query,
                mode: "insensitive",
              },
            },
            {
              shopifyOrderName: {
                contains: parsed.query,
                mode: "insensitive",
              },
            },
            {
              customerEmail: { contains: parsed.query, mode: "insensitive" },
            },
          ],
        }
      : {}),
  };
  const [totalItems, orders, branches, shopifyMirrors] = await Promise.all([
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
    db.branch.findMany({
      where: getAdminBranchWhere(physicalBranchesEnabled),
      orderBy: [
        { kind: "asc" },
        { sortOrder: "asc" },
        { city: "asc" },
        { name: "asc" },
      ],
    }),
    localOnlyOrderFiltersActive
      ? Promise.resolve([])
      : db.shopifyOrderMirror.findMany({
          where: shopifyMirrorWhere,
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
  ]);

  return {
    physicalBranchesEnabled,
    branches: branches.map((branch) => ({
      id: branch.id,
      city: physicalBranchesEnabled ? branch.city : "",
      name: physicalBranchesEnabled ? branch.name : "שירות מרחוק",
      slug: branch.slug,
    })),
    items: orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      source: "LOCAL" as const,
      sourceLabel: getOrderSourceLabel("LOCAL"),
      sourceDescription: getOrderSourceDescription("LOCAL"),
      readOnly: false,
      status: order.status,
      fulfillmentMethod: order.fulfillmentMethod,
      total: Number(order.total),
      email: order.email,
      phone: order.phone,
      recipientName: order.recipientName,
      branchName: physicalBranchesEnabled
        ? (order.branch?.name ?? "שירות מרחוק")
        : "שירות מרחוק",
      branchCity: physicalBranchesEnabled ? (order.branch?.city ?? "") : "",
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
    shopifyMirrorsHiddenByLocalFilters: localOnlyOrderFiltersActive,
    shopifyMirrors: shopifyMirrors.map((order) => ({
      id: order.id,
      source: "SHOPIFY_MIRROR" as const,
      sourceLabel: getOrderSourceLabel("SHOPIFY_MIRROR"),
      sourceDescription: getOrderSourceDescription("SHOPIFY_MIRROR"),
      readOnly: true,
      shopifyOrderId: order.shopifyOrderId,
      shopifyOrderName: order.shopifyOrderName,
      customerEmail: order.customerEmail,
      financialStatus: order.financialStatus,
      financialStatusLabel: getShopifyFinancialStatusLabel(
        order.financialStatus,
      ),
      fulfillmentStatus: order.fulfillmentStatus,
      fulfillmentStatusLabel: getShopifyFulfillmentStatusLabel(
        order.fulfillmentStatus,
      ),
      supplierKey: order.supplierKey,
      total: Number(order.total),
      currency: order.currency,
      createdAt: order.createdAt,
      processedAt: order.processedAt,
      adminUrl: getShopifyAdminOrderUrl({
        shopDomain: env.SHOPIFY_STORE_DOMAIN,
        shopifyOrderId: order.shopifyOrderId,
      }),
    })),
    pageInfo: createAdminPageInfo({
      page: parsed.page,
      pageSize: parsed.pageSize,
      totalItems,
    }),
    totals: await getOrderTotals(),
  };
}

export async function listAdminCatalog(input: AdminCatalogListInput) {
  const parsed = adminCatalogListInputSchema.parse(input);
  const serviceSettings = await getAdminServiceSettings();
  const physicalBranchesEnabled =
    serviceSettings?.physicalBranchesEnabled ?? false;
  const branchWhere = getAdminBranchWhere(physicalBranchesEnabled);
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
      orderBy: getAdminCatalogSort(parsed.sort),
      skip: getAdminSkip(parsed),
      take: parsed.pageSize,
      include: {
        category: true,
        material: true,
        stone: true,
        variants: {
          include: {
            inventoryItems: {
              where: { branch: branchWhere },
              include: { branch: true },
            },
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
    db.branch.findMany({
      where: branchWhere,
      orderBy: [
        { kind: "asc" },
        { sortOrder: "asc" },
        { city: "asc" },
        { name: "asc" },
      ],
    }),
    db.coupon.findMany({ orderBy: { startsAt: "desc" }, take: 20 }),
  ]);

  return {
    physicalBranchesEnabled,
    branches: branches.map((branch) => ({
      id: branch.id,
      slug: branch.slug,
      name: physicalBranchesEnabled ? branch.name : "שירות מרחוק",
      city: physicalBranchesEnabled ? branch.city : "",
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
      availabilityMode: product.availabilityMode,
      commerceHighlights: product.commerceHighlights,
      deliveryPromise: product.deliveryPromise,
      returnPolicy: product.returnPolicy,
      careInstructions: product.careInstructions,
      warranty: product.warranty,
      categoryName: product.category.name,
      materialName: product.material.name,
      stoneName: product.stone?.name ?? null,
      basePrice: Number(product.basePrice),
      variants: product.variants.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        name: variant.name,
        size: variant.size,
        metalColor: variant.metalColor,
        stoneColor: variant.stoneColor,
        price: Number(variant.prices[0]?.amount ?? product.basePrice),
        compareAt: variant.prices[0]?.compareAt
          ? Number(variant.prices[0].compareAt)
          : null,
        inventory: variant.inventoryItems.map((item) => ({
          branchId: item.branchId,
          branchName: physicalBranchesEnabled
            ? item.branch.name
            : "שירות מרחוק",
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

export async function listAdminInventory(input: AdminInventoryListInput) {
  const parsed = adminInventoryListInputSchema.parse(input);
  const serviceSettings = await getAdminServiceSettings();
  const physicalBranchesEnabled =
    serviceSettings?.physicalBranchesEnabled ?? false;
  const branchWhere = getAdminBranchWhere(physicalBranchesEnabled);
  const where: Prisma.InventoryItemWhereInput = {
    branch: branchWhere,
    ...(physicalBranchesEnabled && parsed.branchId
      ? { branchId: parsed.branchId }
      : {}),
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
    db.branch.findMany({
      where: branchWhere,
      orderBy: [
        { kind: "asc" },
        { sortOrder: "asc" },
        { city: "asc" },
        { name: "asc" },
      ],
    }),
  ]);

  return {
    physicalBranchesEnabled,
    branches: branches.map((branch) => ({
      id: branch.id,
      city: physicalBranchesEnabled ? branch.city : "",
      name: physicalBranchesEnabled ? branch.name : "שירות מרחוק",
      slug: branch.slug,
    })),
    items: items.map((item) => ({
      id: item.id,
      branchId: item.branchId,
      branchName: physicalBranchesEnabled ? item.branch.name : "שירות מרחוק",
      branchCity: physicalBranchesEnabled ? item.branch.city : "",
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

export async function listAdminCustomers(input: AdminCustomerListInput) {
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

export async function recordAdminCustomerDataAccess(input: {
  adminUserId: string;
  page: number;
  pageSize: number;
  query?: string;
  resultCount: number;
  totalItems: number;
}) {
  return db.auditLog.create({
    data: {
      adminUserId: input.adminUserId,
      action: "admin_customer_data_viewed",
      entity: "Customer",
      metadata: {
        page: input.page,
        pageSize: input.pageSize,
        queryLength: input.query?.length ?? 0,
        queryPresent: Boolean(input.query),
        resultCount: input.resultCount,
        totalItems: input.totalItems,
      },
    },
  });
}

export async function listAdminAppointments(input: AdminAppointmentListInput) {
  const parsed = adminAppointmentListInputSchema.parse(input);
  const serviceSettings = await getAdminServiceSettings();
  const physicalBranchesEnabled =
    serviceSettings?.physicalBranchesEnabled ?? false;
  const branchWhere = getAdminBranchWhere(physicalBranchesEnabled);
  const where: Prisma.AppointmentWhereInput = {
    ...(parsed.status ? { status: parsed.status } : {}),
    branch: branchWhere,
    ...(physicalBranchesEnabled && parsed.branchId
      ? { branchId: parsed.branchId }
      : {}),
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
    db.branch.findMany({
      where: branchWhere,
      orderBy: [
        { kind: "asc" },
        { sortOrder: "asc" },
        { city: "asc" },
        { name: "asc" },
      ],
    }),
  ]);

  return {
    physicalBranchesEnabled,
    branches: branches.map((branch) => ({
      id: branch.id,
      city: physicalBranchesEnabled ? branch.city : "",
      name: physicalBranchesEnabled ? branch.name : "שירות מרחוק",
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
      branchName: physicalBranchesEnabled
        ? appointment.branch.name
        : "שירות מרחוק",
      branchCity: physicalBranchesEnabled ? appointment.branch.city : "",
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

  const serviceSettings = await getAdminServiceSettings();
  const physicalBranchesEnabled =
    serviceSettings?.physicalBranchesEnabled ?? false;

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
          name: physicalBranchesEnabled ? order.branch.name : "שירות מרחוק",
          city: physicalBranchesEnabled ? order.branch.city : "",
          phone: physicalBranchesEnabled
            ? order.branch.phone
            : (serviceSettings?.displayPhone ?? order.branch.phone),
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
      branchName: physicalBranchesEnabled ? entry.branch.name : "שירות מרחוק",
      variantSku: entry.variant.sku,
      delta: entry.delta,
      reason: entry.reason,
      createdAt: entry.createdAt,
    })),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export async function listAdminAuditLogs(input: AdminAuditListInput) {
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

export async function listAdminOutboxEvents(input: AdminOutboxListInput) {
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

export async function listAdminJobRuns(input: AdminJobRunListInput) {
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
  return createProductionIntegrationSummaries({
    aiGatewayApiKey: env.AI_GATEWAY_API_KEY,
    cardComApiName: env.CARD_COM_API_NAME,
    cardComApiPassword: env.CARD_COM_API_PASSWORD,
    cardComTerminal: env.CARD_COM_TERMINAL,
    cardComWebhookSecret: env.CARD_COM_WEBHOOK_SECRET,
    cronSecret: env.CRON_SECRET,
    googleGenerativeAiApiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
    jobRunnerSecret: env.JOB_RUNNER_SECRET,
    nodeEnv: env.NODE_ENV,
    notificationOperational: notificationProvider.isOperational(),
    notificationProviderName: notificationProvider.providerName(),
    operationsEmail: env.OPERATIONS_EMAIL,
    resendApiKey: env.RESEND_API_KEY,
    shopifyAdminAccessToken: env.SHOPIFY_ADMIN_ACCESS_TOKEN,
    shopifyClientId: env.SHOPIFY_CLIENT_ID,
    shopifyClientSecret: env.SHOPIFY_CLIENT_SECRET,
    shopifyDropshipEnabled: env.SHOPIFY_DROPSHIP_ENABLED,
    shopifyStoreDomain: env.SHOPIFY_STORE_DOMAIN,
    shopifyStorefrontAccessToken: env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    shopifyWebhookSecret: env.SHOPIFY_WEBHOOK_SECRET,
    smsProviderApiKey: env.SMS_PROVIDER_API_KEY,
    storeFromEmail: env.STORE_FROM_EMAIL,
    typesenseApiKey: env.TYPESENSE_API_KEY,
    typesenseHost: env.TYPESENSE_HOST,
    vercelOidcToken: env.VERCEL_OIDC_TOKEN,
  });
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
    { label: "מוכן למסירה", at: order.readyForPickupAt },
    { label: "נשלחה", at: order.shippedAt },
    { label: "הושלמה", at: order.completedAt },
    { label: "בוטלה", at: order.cancelledAt },
    { label: "זוכתה", at: order.refundedAt },
  ].filter((event): event is { label: string; at: Date } => Boolean(event.at));
}
