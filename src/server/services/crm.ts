import type { Prisma } from "@prisma/client";

import { db } from "~/server/db";

/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */

const vipLifetimeValueThreshold = 2_500;
/**
 * Recency thresholds (days since last order) for churn-risk banding.
 * Strictly increasing so every band is reachable: WARNING < HIGH < DORMANT.
 * (Previously DORMANT=90 < HIGH=120 made "HIGH" dead code — G2.)
 */
const churnWarningDays = 60;
const churnHighDays = 120;
const churnDormantDays = 180;

/** Orders in these statuses do not contribute to revenue / lifetime value. */
const nonRevenueOrderStatuses = ["CANCELLED", "REFUNDED"];

/** Single shared definition of a revenue-bearing order (G3). */
export function isRevenueOrder(order: { status: string }) {
  return !nonRevenueOrderStatuses.includes(order.status);
}

type CustomerSummary = ReturnType<typeof createCustomerSummary>;

export async function getCrmOverview(input: { adminUserId?: string } = {}) {
  await auditCrmAccess({
    adminUserId: input.adminUserId,
    action: "admin_crm_overview_viewed",
    metadata: { scope: "overview" },
  });

  const dormantCutoff = new Date();
  dormantCutoff.setDate(dormantCutoff.getDate() - churnDormantDays);
  const warningCutoff = new Date();
  warningCutoff.setDate(warningCutoff.getDate() - churnWarningDays);

  const [
    customers,
    openTasks,
    overdueTasks,
    segments,
    activeCarts,
    activeCartsByCustomer,
    wishlistCustomers,
    openServiceRequests,
    recentNotes,
    totalCustomers,
    snapshotAggregate,
    repeatCustomers,
    vipSnapshots,
    dormantSnapshots,
    atRiskSnapshots,
  ] = await Promise.all([
    db.customer.findMany({
      orderBy: { updatedAt: "desc" },
      take: 12,
      include: {
        metricSnapshots: true,
        orders: {
          select: { id: true, total: true, createdAt: true, status: true },
        },
        wishlist: { include: { items: true } },
        segmentMemberships: { include: { segment: true } },
      },
    }),
    db.customerTask.count({ where: { status: "OPEN" } }),
    db.customerTask.count({
      where: { status: "OPEN", dueAt: { lt: new Date() } },
    }),
    db.customerSegment.findMany({
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
      include: { memberships: true },
    }),
    db.cart.count({ where: { status: "ACTIVE" } }),
    db.cart.findMany({
      where: { status: "ACTIVE", customerId: { not: null } },
      select: { customerId: true },
    }),
    db.wishlist.count({ where: { items: { some: {} } } }),
    db.serviceRequest.count({
      where: { status: { in: ["NEW", "IN_REVIEW", "WAITING_FOR_CUSTOMER"] } },
    }),
    db.customerNote.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customer: true, adminUser: true },
    }),
    db.customer.count(),
    db.customerMetricSnapshot.aggregate({
      _sum: { lifetimeValue: true, orderCount: true },
      _avg: { lifetimeValue: true, averageOrderValue: true },
      _count: true,
    }),
    db.order.groupBy({
      by: ["customerId"],
      where: { customerId: { not: null } },
      _count: { _all: true },
    }),
    // Segment lists derive from metric snapshots across the whole customer base,
    // not just the 12 most-recently-updated customers (G4).
    db.customerMetricSnapshot.findMany({
      where: { lifetimeValue: { gte: vipLifetimeValueThreshold } },
      orderBy: { lifetimeValue: "desc" },
      take: 5,
      select: { customerId: true },
    }),
    db.customerMetricSnapshot.findMany({
      where: { orderCount: { gt: 0 }, lastOrderAt: { lt: dormantCutoff } },
      orderBy: { lifetimeValue: "desc" },
      take: 5,
      select: { customerId: true },
    }),
    db.customerMetricSnapshot.findMany({
      where: { orderCount: { gt: 0 }, lastOrderAt: { lt: warningCutoff } },
      orderBy: { lifetimeValue: "desc" },
      take: 5,
      select: { customerId: true },
    }),
  ]);

  const openCartCustomerIds = new Set(
    activeCartsByCustomer
      .map((cart) => cart.customerId)
      .filter((value): value is string => Boolean(value)),
  );

  const customersWithOrders = repeatCustomers.length;
  const repeatBuyers = repeatCustomers.filter(
    (row) => row._count._all > 1,
  ).length;

  const enrichedCustomers = customers.map((customer) =>
    createCustomerSummary(customer, openCartCustomerIds),
  );

  // Enrich the customers referenced by the full-base lists with the same
  // summary shape used everywhere else, so the output contract is unchanged.
  const listCustomerIds = Array.from(
    new Set(
      [...vipSnapshots, ...dormantSnapshots, ...atRiskSnapshots].map(
        (snapshot) => snapshot.customerId,
      ),
    ),
  );
  const listCustomers = listCustomerIds.length
    ? await db.customer.findMany({
        where: { id: { in: listCustomerIds } },
        include: {
          orders: {
            select: { id: true, total: true, createdAt: true, status: true },
          },
          wishlist: { include: { items: true } },
          segmentMemberships: { include: { segment: true } },
        },
      })
    : [];
  const summaryByCustomerId = new Map(
    listCustomers.map((customer) => [
      customer.id,
      createCustomerSummary(customer, openCartCustomerIds),
    ]),
  );
  const resolveSummaries = (rows: Array<{ customerId: string }>) =>
    rows
      .map((row) => summaryByCustomerId.get(row.customerId))
      .filter((summary): summary is CustomerSummary => Boolean(summary));

  const vipCustomers = resolveSummaries(vipSnapshots);
  const dormantCustomers = resolveSummaries(dormantSnapshots);
  const atRiskCustomers = resolveSummaries(atRiskSnapshots);
  const highIntentCustomers = enrichedCustomers
    .filter((customer) => customer.wishlistItems > 0 || customer.openCart)
    .slice(0, 5);

  const totalLifetimeValue = Number(snapshotAggregate._sum.lifetimeValue ?? 0);
  const averageLifetimeValue = Number(
    snapshotAggregate._avg.lifetimeValue ?? 0,
  );
  const averageOrderValue = Number(
    snapshotAggregate._avg.averageOrderValue ?? 0,
  );
  const repeatPurchaseRate =
    customersWithOrders > 0
      ? Math.round((repeatBuyers / customersWithOrders) * 100)
      : 0;

  return {
    counts: {
      customers: totalCustomers,
      openTasks,
      overdueTasks,
      activeCarts,
      wishlistCustomers,
      openServiceRequests,
      segments: segments.length,
      atRisk: atRiskCustomers.length,
    },
    kpis: {
      totalLifetimeValue: Math.round(totalLifetimeValue * 100) / 100,
      averageLifetimeValue: Math.round(averageLifetimeValue * 100) / 100,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      repeatPurchaseRate,
      customersWithOrders,
    },
    segments: segments.map((segment) => ({
      id: segment.id,
      key: segment.key,
      name: segment.name,
      description: segment.description,
      members: segment.memberships.length,
      isSystem: segment.isSystem,
    })),
    vipCustomers,
    highIntentCustomers,
    dormantCustomers,
    atRiskCustomers,
    recentCustomers: enrichedCustomers,
    recentNotes: recentNotes.map((note) => ({
      id: note.id,
      customerId: note.customerId,
      customerName: getCustomerDisplayName(note.customer),
      adminName: note.adminUser?.name ?? "System",
      content: note.content,
      createdAt: note.createdAt,
    })),
    freshness: { generatedAt: new Date(), source: "live-database" as const },
  };
}

export async function getCustomer360Profile(input: {
  customerId: string;
  adminUserId?: string;
}) {
  const customer = await db.customer.findUnique({
    where: { id: input.customerId },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: { items: true, payments: true },
      },
      wishlist: {
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    include: {
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
          },
        },
      },
      appointments: { orderBy: { startsAt: "desc" }, take: 10 },
      pushSubscriptions: { orderBy: { updatedAt: "desc" }, take: 10 },
      notes: {
        orderBy: { createdAt: "desc" },
        include: { adminUser: true },
        take: 20,
      },
      tasks: {
        orderBy: [{ status: "asc" }, { dueAt: "asc" }],
        include: { assignedAdminUser: true },
        take: 20,
      },
      segmentMemberships: {
        include: { segment: true },
        orderBy: { score: "desc" },
      },
      metricSnapshots: true,
      analyticsEvents: {
        orderBy: { occurredAt: "desc" },
        take: 50,
      },
    },
  });

  if (!customer) return null;

  await auditCrmAccess({
    adminUserId: input.adminUserId,
    action: "admin_customer_360_viewed",
    entityId: customer.id,
    metadata: {
      hasEmail: Boolean(customer.email),
      hasPhone: Boolean(customer.phone),
    },
  });

  const metric =
    customer.metricSnapshots[0] ??
    (await refreshCustomerMetricSnapshot(customer.id));
  const serviceRequests = await db.serviceRequest.findMany({
    where: {
      OR: [
        customer.email ? { email: customer.email } : undefined,
        customer.phone ? { phone: customer.phone } : undefined,
      ].filter(Boolean) as Prisma.ServiceRequestWhereInput[],
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const hasOpenCart =
    (await db.cart.count({
      where: { customerId: customer.id, status: "ACTIVE" },
    })) > 0;
  const lastOrderAt = metric?.lastOrderAt ?? null;
  const recencyDays = lastOrderAt
    ? Math.floor((Date.now() - lastOrderAt.getTime()) / (24 * 60 * 60 * 1000))
    : null;
  const orderCount = metric?.orderCount ?? customer.orders.length;
  const lifetimeValue = metric ? Number(metric.lifetimeValue) : 0;
  const churnRisk = computeChurnRisk({ orderCount, recencyDays });
  const healthScore = computeHealthScore({
    lifetimeValue,
    orderCount,
    wishlistItems: metric?.wishlistItems ?? 0,
    openCart: hasOpenCart,
    recencyDays,
  });

  return {
    customer: {
      id: customer.id,
      name: getCustomerDisplayName(customer),
      email: customer.email,
      phone: customer.phone,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    },
    risk: {
      churnRisk,
      healthScore,
      recencyDays,
      openCart: hasOpenCart,
      nextBestAction: computeNextBestAction({
        churnRisk,
        openCart: hasOpenCart,
        wishlistItems: metric?.wishlistItems ?? 0,
        orderCount,
        lifetimeValue,
      }),
    },
    metric: metric
      ? {
          lifetimeValue: Number(metric.lifetimeValue),
          orderCount: metric.orderCount,
          averageOrderValue: Number(metric.averageOrderValue),
          firstOrderAt: metric.firstOrderAt,
          lastOrderAt: metric.lastOrderAt,
          wishlistItems: metric.wishlistItems,
          serviceRequests: metric.serviceRequests,
          appointments: metric.appointments,
          segmentScore: metric.segmentScore,
        }
      : null,
    segments: customer.segmentMemberships.map((membership) => ({
      id: membership.segmentId,
      key: membership.segment.key,
      name: membership.segment.name,
      reason: membership.reason,
      score: membership.score,
    })),
    orders: customer.orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.payments[0]?.status ?? "PENDING",
      total: Number(order.total),
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      createdAt: order.createdAt,
    })),
    wishlist: customer.wishlist
      ? customer.wishlist.items.map((item) => ({
          id: item.id,
          productName: item.variant.product.name,
          productSlug: item.variant.product.slug,
          variantName: item.variant.name,
          image: item.variant.product.media[0]?.url ?? null,
          createdAt: item.createdAt,
        }))
      : [],
    serviceRequests: serviceRequests.map((request) => ({
      id: request.id,
      status: request.status,
      subject: request.productReference ?? request.orderNumber ?? request.email,
      createdAt: request.createdAt,
    })),
    appointments: customer.appointments.map((appointment) => ({
      id: appointment.id,
      topic: appointment.topic,
      status: appointment.status,
      startsAt: appointment.startsAt,
    })),
    consent: {
      pushMarketing: customer.pushSubscriptions.some(
        (subscription) => subscription.marketingOptIn,
      ),
      pushTransactional: customer.pushSubscriptions.some(
        (subscription) => subscription.transactionalOptIn,
      ),
      pushSubscriptions: customer.pushSubscriptions.length,
    },
    notes: customer.notes.map((note) => ({
      id: note.id,
      content: note.content,
      visibility: note.visibility,
      adminName: note.adminUser?.name ?? "System",
      createdAt: note.createdAt,
    })),
    tasks: customer.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      dueAt: task.dueAt,
      completedAt: task.completedAt,
      assignedAdminName: task.assignedAdminUser?.name ?? null,
      createdAt: task.createdAt,
    })),
    timeline: createCustomerTimeline(customer.analyticsEvents, customer.orders),
  };
}

export async function refreshCustomerMetricSnapshot(customerId: string) {
  const customer = await db.customer.findUnique({
    where: { id: customerId },
    include: {
      orders: true,
      wishlist: { include: { items: true } },
      appointments: true,
    },
  });

  if (!customer) return null;

  const completedOrders = customer.orders.filter(isRevenueOrder);
  const lifetimeValue = completedOrders.reduce(
    (sum, order) => sum + Number(order.total),
    0,
  );
  const orderDates = completedOrders
    .map((order) => order.createdAt)
    .sort((first, second) => first.getTime() - second.getTime());
  const serviceRequests = await db.serviceRequest.count({
    where: {
      OR: [
        customer.email ? { email: customer.email } : undefined,
        customer.phone ? { phone: customer.phone } : undefined,
      ].filter(Boolean) as Prisma.ServiceRequestWhereInput[],
    },
  });
  const orderCount = completedOrders.length;

  return db.customerMetricSnapshot.upsert({
    where: { customerId },
    create: {
      customerId,
      lifetimeValue,
      orderCount,
      averageOrderValue: orderCount > 0 ? lifetimeValue / orderCount : 0,
      firstOrderAt: orderDates[0] ?? null,
      lastOrderAt: orderDates.at(-1) ?? null,
      wishlistItems: customer.wishlist?.items.length ?? 0,
      serviceRequests,
      appointments: customer.appointments.length,
      segmentScore: calculateSegmentScore({
        lifetimeValue,
        orderCount,
        wishlistItems: customer.wishlist?.items.length ?? 0,
        serviceRequests,
      }),
      metadata: { source: "crm_snapshot_refresh" },
    },
    update: {
      lifetimeValue,
      orderCount,
      averageOrderValue: orderCount > 0 ? lifetimeValue / orderCount : 0,
      firstOrderAt: orderDates[0] ?? null,
      lastOrderAt: orderDates.at(-1) ?? null,
      wishlistItems: customer.wishlist?.items.length ?? 0,
      serviceRequests,
      appointments: customer.appointments.length,
      segmentScore: calculateSegmentScore({
        lifetimeValue,
        orderCount,
        wishlistItems: customer.wishlist?.items.length ?? 0,
        serviceRequests,
      }),
      metadata: { source: "crm_snapshot_refresh" },
    },
  });
}

export async function createCustomerNote(input: {
  customerId: string;
  adminUserId?: string;
  content: string;
  visibility?: string;
}) {
  const note = await db.customerNote.create({
    data: {
      customerId: input.customerId,
      adminUserId: input.adminUserId,
      content: input.content.trim(),
      visibility: input.visibility ?? "internal",
    },
  });

  await auditCrmAccess({
    adminUserId: input.adminUserId,
    action: "admin_customer_note_created",
    entityId: input.customerId,
    metadata: { noteId: note.id },
  });

  return note;
}

export async function createCustomerTask(input: {
  customerId: string;
  assignedAdminUserId?: string;
  title: string;
  description?: string;
  dueAt?: Date;
}) {
  const task = await db.customerTask.create({
    data: {
      customerId: input.customerId,
      assignedAdminUserId: input.assignedAdminUserId,
      title: input.title.trim(),
      description: input.description?.trim(),
      dueAt: input.dueAt,
    },
  });

  await auditCrmAccess({
    adminUserId: input.assignedAdminUserId,
    action: "admin_customer_task_created",
    entityId: input.customerId,
    metadata: { taskId: task.id },
  });

  return task;
}

async function auditCrmAccess(input: {
  adminUserId?: string;
  action: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  if (!input.adminUserId) return null;

  return db.auditLog.create({
    data: {
      adminUserId: input.adminUserId,
      action: input.action,
      entity: "Customer",
      entityId: input.entityId,
      metadata: input.metadata,
    },
  });
}

function createCustomerSummary(
  customer: {
    id: string;
    email: string | null;
    phone: string | null;
    firstName: string | null;
    lastName: string | null;
    orders: Array<{ total: Prisma.Decimal; createdAt: Date; status: string }>;
    wishlist: { items: unknown[] } | null;
    segmentMemberships: Array<{ segment: { name: string } }>;
  },
  openCartCustomerIds: Set<string>,
) {
  const revenueOrders = customer.orders.filter(isRevenueOrder);
  const lifetimeValue = revenueOrders.reduce(
    (sum, order) => sum + Number(order.total),
    0,
  );
  const sortedOrderDates = revenueOrders
    .map((order) => order.createdAt)
    .sort((first, second) => first.getTime() - second.getTime());
  const lastOrderAt = sortedOrderDates.at(-1) ?? null;
  const orderCount = revenueOrders.length;
  const wishlistItems = customer.wishlist?.items.length ?? 0;
  const openCart = openCartCustomerIds.has(customer.id);

  const recencyDays = lastOrderAt
    ? Math.floor((Date.now() - lastOrderAt.getTime()) / (24 * 60 * 60 * 1000))
    : null;
  const churnRisk = computeChurnRisk({ orderCount, recencyDays });
  const healthScore = computeHealthScore({
    lifetimeValue,
    orderCount,
    wishlistItems,
    openCart,
    recencyDays,
  });

  return {
    id: customer.id,
    name: getCustomerDisplayName(customer),
    email: customer.email,
    phone: customer.phone,
    lifetimeValue,
    orderCount,
    lastOrderAt,
    recencyDays,
    wishlistItems,
    openCart,
    churnRisk,
    healthScore,
    nextBestAction: computeNextBestAction({
      churnRisk,
      openCart,
      wishlistItems,
      orderCount,
      lifetimeValue,
    }),
    segments: customer.segmentMemberships.map(
      (membership) => membership.segment.name,
    ),
  };
}

type ChurnRisk = "ACTIVE" | "WARNING" | "HIGH" | "DORMANT";

export function computeChurnRisk(input: {
  orderCount: number;
  recencyDays: number | null;
}): ChurnRisk {
  if (input.orderCount === 0 || input.recencyDays === null) return "ACTIVE";
  if (input.recencyDays >= churnDormantDays) return "DORMANT";
  if (input.recencyDays >= churnHighDays) return "HIGH";
  if (input.recencyDays >= churnWarningDays) return "WARNING";
  return "ACTIVE";
}

/** 0–100 engagement health blending value, frequency and intent signals. */
export function computeHealthScore(input: {
  lifetimeValue: number;
  orderCount: number;
  wishlistItems: number;
  openCart: boolean;
  recencyDays: number | null;
}) {
  const valueScore = Math.min(input.lifetimeValue / 50, 40);
  const frequencyScore = Math.min(input.orderCount * 8, 30);
  const intentScore = Math.min(
    input.wishlistItems * 3 + (input.openCart ? 10 : 0),
    20,
  );
  const recencyPenalty =
    input.recencyDays === null
      ? 0
      : Math.min(Math.floor(input.recencyDays / 15) * 2, 30);

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        10 + valueScore + frequencyScore + intentScore - recencyPenalty,
      ),
    ),
  );
}

function computeNextBestAction(input: {
  churnRisk: ChurnRisk;
  openCart: boolean;
  wishlistItems: number;
  orderCount: number;
  lifetimeValue: number;
}) {
  if (input.openCart) return "עגלה פעילה — שלח תזכורת/קופון להשלמת רכישה";
  if (input.churnRisk === "DORMANT" || input.churnRisk === "HIGH") {
    return "לקוח בסיכון נטישה — קמפיין win-back מותאם";
  }
  if (input.churnRisk === "WARNING") return "מתחיל להתקרר — פנייה יזומה / הטבה";
  if (input.wishlistItems > 0) {
    return "Wishlist פעיל — התראת מלאי/מבצע על פריטים שמורים";
  }
  if (input.orderCount === 0) return "לקוח חדש — אונבורדינג והצעת רכישה ראשונה";
  if (input.lifetimeValue >= vipLifetimeValueThreshold) {
    return "VIP — שירות פרסונלי והזמנות בלעדיות";
  }
  return "לקוח פעיל — הצעת cross-sell מותאמת";
}

function createCustomerTimeline(
  events: Array<{
    id: string;
    type: string;
    occurredAt: Date;
    path: string | null;
    payload: Prisma.JsonValue | null;
  }>,
  orders: Array<{
    id: string;
    orderNumber: string;
    total: Prisma.Decimal;
    createdAt: Date;
  }>,
) {
  const analyticsTimeline = events.map((event) => ({
    id: event.id,
    kind: "analytics" as const,
    label: event.type,
    at: event.occurredAt,
    detail: {
      path: event.path,
      payload: event.payload,
    },
  }));
  const orderTimeline = orders.map((order) => ({
    id: order.id,
    kind: "order" as const,
    label: `Order ${order.orderNumber}`,
    at: order.createdAt,
    detail: { total: Number(order.total) },
  }));

  return [...analyticsTimeline, ...orderTimeline]
    .sort((first, second) => second.at.getTime() - first.at.getTime())
    .slice(0, 80);
}

function calculateSegmentScore(input: {
  lifetimeValue: number;
  orderCount: number;
  wishlistItems: number;
  serviceRequests: number;
}) {
  return Math.round(
    input.lifetimeValue / 100 +
      input.orderCount * 10 +
      input.wishlistItems * 5 -
      input.serviceRequests * 3,
  );
}

function getCustomerDisplayName(customer: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
}) {
  const fullName = [customer.firstName, customer.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || customer.email || customer.phone || "לקוח ללא שם";
}
