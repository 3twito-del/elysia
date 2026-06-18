import type { OrderStatus, OutboxEvent, Prisma } from "@prisma/client";

import { env } from "~/env";
import { formatPrice } from "~/lib/format";
import {
  footerBusinessDetails,
  orderLegalLinks,
  vatIncludedNotice,
} from "~/lib/legal-content";
import { notificationProvider } from "~/server/adapters/notifications";
import { searchProvider } from "~/server/adapters/search";
import { db } from "~/server/db";
import {
  BUSINESS_EVENTS,
  listDueOutboxEvents,
  markOutboxEventStatus,
  recordJobRun,
} from "~/server/services/outbox";
import {
  processBackInStockInterests,
  sendCartReminder,
  sendPushCampaign,
} from "~/server/services/push";

export type ProcessOutboxResult = {
  scanned: number;
  processed: number;
  failed: number;
  skipped: number;
};

type JobStatus = "COMPLETED" | "FAILED" | "SKIPPED";

export function getPublicOutboxJobFailureMessage(eventType: string) {
  if (eventType === BUSINESS_EVENTS.searchReindexRequested) {
    return "Search reindex job failed. It will retry from the outbox when the search provider is available.";
  }

  if (eventType === BUSINESS_EVENTS.emailRequested) {
    return "Transactional email job failed. It will retry from the outbox when email delivery is available.";
  }

  if (
    eventType === BUSINESS_EVENTS.pushCampaignRequested ||
    eventType === BUSINESS_EVENTS.pushCartReminderDue
  ) {
    return "Push notification job failed. It will retry from the outbox when push delivery is available.";
  }

  return "Outbox job failed. It will retry when the processor is available.";
}

export async function processDueOutboxEvents(input: { limit?: number } = {}) {
  const pushAutomation = await processBackInStockInterests().catch(
    (error: unknown) => ({
      error: error instanceof Error ? error.message : "Push automation failed.",
      sent: 0,
      skipped: 0,
    }),
  );
  const events = await listDueOutboxEvents({ limit: input.limit });
  const result: ProcessOutboxResult = {
    scanned: events.length,
    processed: pushAutomation.sent > 0 ? 1 : 0,
    failed: 0,
    skipped: pushAutomation.skipped,
  };

  for (const event of events) {
    try {
      await markOutboxEventStatus({ id: event.id, status: "PROCESSING" });
      const job = await processOutboxEvent(event);

      if (job.status === "SKIPPED") {
        result.skipped += 1;
      } else {
        result.processed += 1;
      }

      await markOutboxEventStatus({ id: event.id, status: "PROCESSED" });
    } catch {
      const publicMessage = getPublicOutboxJobFailureMessage(event.type);

      result.failed += 1;

      await markOutboxEventStatus({
        attempts: event.attempts + 1,
        id: event.id,
        status: "FAILED",
        lastError: publicMessage,
      });

      await recordJobRun({
        name: event.type,
        outboxEventId: event.id,
        status: "FAILED",
        attempts: event.attempts + 1,
        metadata: { eventType: event.type },
        lastError: publicMessage,
      });
    }
  }

  return result;
}

export function canExpireReservationForOrderStatus(status: OrderStatus) {
  return status === "PENDING_PAYMENT";
}

export function getOutboxPayloadString(payload: Prisma.JsonValue, key: string) {
  if (!isJsonRecord(payload)) return null;

  const value = payload[key];

  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);

  return null;
}

export function getOutboxPayloadNumber(payload: Prisma.JsonValue, key: string) {
  if (!isJsonRecord(payload)) return null;

  const value = payload[key];

  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function createOutboxEmailMessage(payload: Prisma.JsonValue) {
  const customerEmail =
    getOutboxPayloadString(payload, "recipientEmail") ??
    getOutboxPayloadString(payload, "customerEmail");
  const orderNumber = getOutboxPayloadString(payload, "orderNumber");
  const template = getOutboxPayloadString(payload, "template") ?? "generic";
  const subject = getOutboxPayloadString(payload, "subject");
  const body = getOutboxPayloadString(payload, "body");

  if (!customerEmail) return null;

  return {
    to: customerEmail,
    subject:
      subject ??
      (orderNumber ? `Elysia ${orderNumber}` : "Elysia order update"),
    body:
      body ??
      createStructuredOrderEmailBody(payload, {
        orderNumber,
        template,
      }) ??
      [
        "Elysia",
        orderNumber ? `Order: ${orderNumber}` : null,
        `Event: ${template}`,
      ]
        .filter(Boolean)
        .join("\n"),
  };
}

function createStructuredOrderEmailBody(
  payload: Prisma.JsonValue,
  input: {
    orderNumber: string | null;
    template: string;
  },
) {
  if (!input.orderNumber) return null;
  if (
    ![
      "cart_checkout_created",
      "manual_order_created",
      "payment_link_created",
      "order_status_updated",
      "shipment_updated",
      "order_refunded",
    ].includes(input.template)
  ) {
    return null;
  }

  const items = getOutboxOrderItems(payload);
  const subtotal = getOutboxPayloadNumber(payload, "subtotal");
  const shipping = getOutboxPayloadNumber(payload, "shipping");
  const discount = getOutboxPayloadNumber(payload, "discount");
  const total =
    getOutboxPayloadNumber(payload, "total") ??
    getOutboxPayloadNumber(payload, "amount");
  const estimatedDelivery =
    getOutboxPayloadString(payload, "estimatedDelivery") ??
    "לפי מדיניות המשלוחים וזמינות ההזמנה.";

  return [
    "Elysia",
    `מספר הזמנה: ${input.orderNumber}`,
    footerBusinessDetails,
    "",
    items.length > 0 ? "פרטי מוצרים:" : "פרטי מוצרים: [להשלמה]",
    ...items,
    subtotal !== null ? `מחיר מוצרים: ${formatPrice(subtotal)}` : null,
    discount && discount > 0 ? `הטבה: ${formatPrice(discount)}` : null,
    shipping !== null ? `משלוח: ${formatPrice(shipping)}` : "משלוח: [להשלמה]",
    total !== null ? `סה״כ לתשלום/שולם: ${formatPrice(total)}` : null,
    vatIncludedNotice,
    `מסירה משוערת: ${estimatedDelivery}`,
    "",
    "קישורים חשובים:",
    ...orderLegalLinks.map(
      (item) => `${item.label}: ${createPublicSiteUrl(item.href)}`,
    ),
    `שירות לקוחות: ${createPublicSiteUrl(
      `/service?topic=order&orderNumber=${encodeURIComponent(
        input.orderNumber,
      )}`,
    )}`,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

function getOutboxOrderItems(payload: Prisma.JsonValue) {
  if (!isJsonRecord(payload) || !Array.isArray(payload.items)) return [];

  return payload.items
    .map((item) => {
      if (!isJsonRecord(item)) return null;

      const name = typeof item.name === "string" ? item.name : "[להשלמה]";
      const sku = typeof item.sku === "string" ? item.sku : "[להשלמה]";
      const quantity =
        typeof item.quantity === "number" && Number.isFinite(item.quantity)
          ? item.quantity
          : null;
      const unitPrice =
        typeof item.unitPrice === "number" && Number.isFinite(item.unitPrice)
          ? item.unitPrice
          : null;
      const lineTotal =
        typeof item.lineTotal === "number" && Number.isFinite(item.lineTotal)
          ? item.lineTotal
          : null;

      return [
        `- ${name}`,
        `מק״ט: ${sku}`,
        quantity !== null ? `כמות: ${quantity}` : null,
        unitPrice !== null ? `מחיר יחידה: ${formatPrice(unitPrice)}` : null,
        lineTotal !== null ? `סה״כ: ${formatPrice(lineTotal)}` : null,
      ]
        .filter(Boolean)
        .join(" | ");
    })
    .filter((item): item is string => Boolean(item));
}

function createPublicSiteUrl(path: string) {
  return new URL(path, env.SITE_URL ?? "https://elysia-jewellery.com").toString();
}

function isJsonRecord(value: Prisma.JsonValue): value is Prisma.JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function redactJobRecipient(value: string) {
  const normalized = value.trim();

  if (!normalized) return "[redacted]";

  if (normalized.includes("@")) {
    const [localPart, domain] = normalized.split("@");
    const safeLocal = localPart ? `${localPart.slice(0, 1)}***` : "[redacted]";

    return domain ? `${safeLocal}@${domain}` : safeLocal;
  }

  const digits = normalized.replace(/\D/g, "");

  return digits.length >= 4 ? `***${digits.slice(-4)}` : "[redacted]";
}

async function processOutboxEvent(event: OutboxEvent) {
  if (event.type === BUSINESS_EVENTS.searchReindexRequested) {
    const indexed = await searchProvider.indexProducts();

    await recordJobRun({
      name: event.type,
      outboxEventId: event.id,
      status: "COMPLETED",
      attempts: event.attempts + 1,
      metadata: indexed,
    });

    return { status: "COMPLETED" as const };
  }

  if (event.type === BUSINESS_EVENTS.inventoryReservationExpired) {
    return processReservationExpiryEvent(event);
  }

  if (event.type === BUSINESS_EVENTS.emailRequested) {
    return processEmailRequestedEvent(event);
  }

  if (event.type === BUSINESS_EVENTS.pushCampaignRequested) {
    return processPushCampaignEvent(event);
  }

  if (event.type === BUSINESS_EVENTS.pushCartReminderDue) {
    return processCartReminderEvent(event);
  }

  await recordJobRun({
    name: event.type,
    outboxEventId: event.id,
    status: "COMPLETED",
    attempts: event.attempts + 1,
    metadata: { eventType: event.type },
  });

  return { status: "COMPLETED" as const };
}

async function processPushCampaignEvent(event: OutboxEvent) {
  const campaignId = getOutboxPayloadString(event.payload, "campaignId");

  if (!campaignId) {
    return recordSkippedJob(event, "Missing campaignId in push payload.");
  }

  const result = await sendPushCampaign(campaignId);

  await recordJobRun({
    name: event.type,
    outboxEventId: event.id,
    status: "COMPLETED",
    attempts: event.attempts + 1,
    metadata: result,
  });

  return { status: "COMPLETED" as const };
}

async function processCartReminderEvent(event: OutboxEvent) {
  const sessionKey = getOutboxPayloadString(event.payload, "sessionKey");

  if (!sessionKey) {
    return recordSkippedJob(event, "Missing sessionKey in cart reminder.");
  }

  const result = await sendCartReminder(sessionKey);

  await recordJobRun({
    name: event.type,
    outboxEventId: event.id,
    status: result.sent > 0 ? "COMPLETED" : "SKIPPED",
    attempts: event.attempts + 1,
    metadata: result,
  });

  return { status: result.sent > 0 ? "COMPLETED" : "SKIPPED" };
}

async function processReservationExpiryEvent(event: OutboxEvent) {
  const orderId = getOutboxPayloadString(event.payload, "orderId");

  if (!orderId) {
    return recordSkippedJob(event, "Missing orderId in reservation payload.");
  }

  const metadata = await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { id: true, orderNumber: true, status: true },
    });

    if (!order) {
      return { skipped: true, reason: "Order not found." };
    }

    if (!canExpireReservationForOrderStatus(order.status)) {
      return {
        skipped: true,
        reason: `Order status ${order.status} does not expire reservations.`,
      };
    }

    const reservations = await tx.inventoryReservation.findMany({
      where: {
        orderId,
        releasedAt: null,
        expiresAt: { lte: new Date() },
      },
    });

    if (reservations.length === 0) {
      return { skipped: true, reason: "No due reservations." };
    }

    for (const reservation of reservations) {
      await tx.inventoryItem.updateMany({
        where: {
          branchId: reservation.branchId,
          variantId: reservation.variantId,
          reserved: { gte: reservation.quantity },
        },
        data: {
          reserved: { decrement: reservation.quantity },
        },
      });

      await tx.inventoryReservation.update({
        where: { id: reservation.id },
        data: { releasedAt: new Date() },
      });

      await tx.inventoryLedger.create({
        data: {
          branchId: reservation.branchId,
          variantId: reservation.variantId,
          delta: reservation.quantity,
          reason: "reservation_expired",
          reference: order.orderNumber,
        },
      });
    }

    await tx.payment.updateMany({
      where: { orderId, status: "PENDING" },
      data: {
        status: "FAILED",
        providerStatus: "reservation_expired",
        failureCode: "reservation_expired",
      },
    });

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });

    return {
      skipped: false,
      orderId,
      releasedReservations: reservations.length,
      releasedQuantity: reservations.reduce(
        (sum, reservation) => sum + reservation.quantity,
        0,
      ),
    };
  });

  if (metadata.skipped) {
    return recordSkippedJob(event, metadata.reason ?? "Skipped.");
  }

  await recordJobRun({
    name: event.type,
    outboxEventId: event.id,
    status: "COMPLETED",
    attempts: event.attempts + 1,
    metadata,
  });

  return { status: "COMPLETED" as const };
}

async function processEmailRequestedEvent(event: OutboxEvent) {
  const message = createOutboxEmailMessage(event.payload);

  if (!message) {
    return recordSkippedJob(event, "Missing customerEmail in email payload.");
  }

  if (!notificationProvider.isOperational()) {
    return recordSkippedJob(
      event,
      "No transactional email provider is configured.",
    );
  }

  const result = await notificationProvider.sendEmail({
    ...message,
    idempotencyKey: event.idempotencyKey ?? event.id,
  });

  await recordJobRun({
    name: event.type,
    outboxEventId: event.id,
    status: "COMPLETED",
    attempts: event.attempts + 1,
    metadata: {
      provider: result.provider,
      providerMessageId: result.id,
      recipient: redactJobRecipient(message.to),
    },
  });

  return { status: "COMPLETED" as const };
}

async function recordSkippedJob(event: OutboxEvent, reason: string) {
  await recordJobRun({
    name: event.type,
    outboxEventId: event.id,
    status: "SKIPPED",
    attempts: event.attempts + 1,
    metadata: { reason },
  });

  return { status: "SKIPPED" as JobStatus };
}
