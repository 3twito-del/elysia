import type { Prisma } from "@prisma/client";

import { db } from "~/server/db";

/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */

const vipLifetimeValueThreshold = 2_500;
const dormantDays = 90;

export async function getCrmOverview(input: { adminUserId?: string } = {}) {
  await auditCrmAccess({
    adminUserId: input.adminUserId,
    action: "admin_crm_overview_viewed",
    metadata: { scope: "overview" },
  });

  const dormantCutoff = new Date();
  dormantCutoff.setDate(dormantCutoff.getDate() - dormantDays);

  const [
    customers,
    openTasks,
    overdueTasks,
    segments,
    activeCarts,
    wishlistCustomers,
    openServiceRequests,
    recentNotes,
  ] = await Promise.all([
    db.customer.findMany({
      orderBy: { updatedAt: "desc" },
      take: 12,
      include: {
        metricSnapshots: true,
        orders: { select: { id: true, total: true, createdAt: true } },
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
    db.wishlist.count({ where: { items: { some: {} } } }),
    db.serviceRequest.count({
      where: { status: { in: ["NEW", "IN_REVIEW", "WAITING_FOR_CUSTOMER"] } },
    }),
    db.customerNote.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customer: true, adminUser: true },
    }),
  ]);

  const enrichedCustomers = customers.map(createCustomerSummary);
  const vipCustomers = enrichedCustomers
    .filter((customer) => customer.lifetimeValue >= vipLifetimeValueThreshold)
    .slice(0, 5);
  const highIntentCustomers = enrichedCustomers
    .filter((customer) => customer.wishlistItems > 0 || customer.openCart)
    .slice(0, 5);
  const dormantCustomers = enrichedCustomers
    .filter(
      (customer) =>
        customer.lastOrderAt && customer.lastOrderAt < dormantCutoff,
    )
    .slice(0, 5);

  return {
    counts: {
      customers: await db.customer.count(),
      openTasks,
      overdueTasks,
      activeCarts,
      wishlistCustomers,
      openServiceRequests,
      segments: segments.length,
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

  return {
    customer: {
      id: customer.id,
      name: getCustomerDisplayName(customer),
      email: customer.email,
      phone: customer.phone,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
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

  const completedOrders = customer.orders.filter(
    (order) => !["CANCELLED", "REFUNDED"].includes(order.status),
  );
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

function createCustomerSummary(customer: {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  orders: Array<{ total: Prisma.Decimal; createdAt: Date }>;
  wishlist: { items: unknown[] } | null;
  segmentMemberships: Array<{ segment: { name: string } }>;
}) {
  const lifetimeValue = customer.orders.reduce(
    (sum, order) => sum + Number(order.total),
    0,
  );
  const sortedOrderDates = customer.orders
    .map((order) => order.createdAt)
    .sort((first, second) => first.getTime() - second.getTime());

  return {
    id: customer.id,
    name: getCustomerDisplayName(customer),
    email: customer.email,
    phone: customer.phone,
    lifetimeValue,
    orderCount: customer.orders.length,
    lastOrderAt: sortedOrderDates.at(-1) ?? null,
    wishlistItems: customer.wishlist?.items.length ?? 0,
    openCart: false,
    segments: customer.segmentMemberships.map(
      (membership) => membership.segment.name,
    ),
  };
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
