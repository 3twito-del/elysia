import type { OrderStatus, OutboxEvent, Prisma } from "@prisma/client";

import { notificationProvider } from "~/server/adapters/notifications";
import { searchProvider } from "~/server/adapters/search";
import { db } from "~/server/db";
import {
  BUSINESS_EVENTS,
  listDueOutboxEvents,
  markOutboxEventStatus,
  recordJobRun,
} from "~/server/services/outbox";

export type ProcessOutboxResult = {
  scanned: number;
  processed: number;
  failed: number;
  skipped: number;
};

type JobStatus = "COMPLETED" | "FAILED" | "SKIPPED";

export async function processDueOutboxEvents(input: { limit?: number } = {}) {
  const events = await listDueOutboxEvents({ limit: input.limit });
  const result: ProcessOutboxResult = {
    scanned: events.length,
    processed: 0,
    failed: 0,
    skipped: 0,
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";

      result.failed += 1;

      await markOutboxEventStatus({
        id: event.id,
        status: "FAILED",
        lastError: message,
      });

      await recordJobRun({
        name: event.type,
        outboxEventId: event.id,
        status: "FAILED",
        attempts: event.attempts + 1,
        metadata: { eventType: event.type },
        lastError: message,
      });
    }
  }

  return result;
}

export function canExpireReservationForOrderStatus(status: OrderStatus) {
  return status === "PENDING_PAYMENT";
}

export function getOutboxPayloadString(payload: Prisma.JsonValue, key: string) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const value = payload[key];

  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);

  return null;
}

export function createOutboxEmailMessage(payload: Prisma.JsonValue) {
  const customerEmail = getOutboxPayloadString(payload, "customerEmail");
  const orderNumber = getOutboxPayloadString(payload, "orderNumber");
  const template = getOutboxPayloadString(payload, "template") ?? "generic";

  if (!customerEmail) return null;

  return {
    to: customerEmail,
    subject: orderNumber
      ? `Aphrodite ${orderNumber}`
      : "Aphrodite order update",
    body: [
      "Aphrodite",
      orderNumber ? `Order: ${orderNumber}` : null,
      `Event: ${template}`,
    ]
      .filter(Boolean)
      .join("\n"),
  };
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

  await recordJobRun({
    name: event.type,
    outboxEventId: event.id,
    status: "COMPLETED",
    attempts: event.attempts + 1,
    metadata: { eventType: event.type },
  });

  return { status: "COMPLETED" as const };
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
