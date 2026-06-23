import type { OutboxEventStatus, Prisma } from "@prisma/client";

import { db } from "~/server/db";

type TransactionClient = Prisma.TransactionClient;

export const BUSINESS_EVENTS = {
  orderCreated: "order.created",
  paymentCaptured: "payment.captured",
  inventoryReserved: "inventory.reserved",
  inventoryReservationExpired: "inventory.reservation_expired",
  emailRequested: "email.requested",
  pushCampaignRequested: "push.campaign_requested",
  pushCartReminderDue: "push.cart_reminder_due",
  searchReindexRequested: "search.reindex_requested",
  analyticsRollupRequested: "analytics.rollup_requested",
  webhookReceived: "webhook.received",
} as const;

export type BusinessEventType =
  (typeof BUSINESS_EVENTS)[keyof typeof BUSINESS_EVENTS];

export type CreateOutboxEventInput = {
  type: string;
  aggregateType?: string;
  aggregateId?: string;
  payload: Prisma.InputJsonValue;
  idempotencyKey?: string;
  availableAt?: Date;
};

export async function createOutboxEvent(
  tx: TransactionClient,
  input: CreateOutboxEventInput,
) {
  const data = {
    type: input.type,
    aggregateType: input.aggregateType,
    aggregateId: input.aggregateId,
    payload: input.payload,
    idempotencyKey: input.idempotencyKey,
    availableAt: input.availableAt,
  } satisfies Prisma.OutboxEventCreateInput;

  if (!input.idempotencyKey) {
    return tx.outboxEvent.create({ data });
  }

  return tx.outboxEvent.upsert({
    where: { idempotencyKey: input.idempotencyKey },
    update: {
      type: input.type,
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      payload: input.payload,
      availableAt: input.availableAt,
    },
    create: data,
  });
}

export async function enqueueOutboxEvent(input: CreateOutboxEventInput) {
  return db.$transaction((tx) => createOutboxEvent(tx, input));
}

export async function listDueOutboxEvents(input: { limit?: number } = {}) {
  return db.outboxEvent.findMany({
    where: {
      status: { in: ["PENDING", "FAILED"] },
      availableAt: { lte: new Date() },
    },
    orderBy: [{ availableAt: "asc" }, { createdAt: "asc" }],
    take: input.limit ?? 25,
  });
}

export async function markOutboxEventStatus(input: {
  attempts?: number;
  id: string;
  status: OutboxEventStatus;
  lastError?: string;
}) {
  const retryAt =
    input.status === "FAILED"
      ? getOutboxRetryAvailableAt({
          attempts: input.attempts ?? 1,
          seed: input.id,
        })
      : undefined;

  return db.outboxEvent.update({
    where: { id: input.id },
    data: {
      status: input.status,
      lastError: input.lastError,
      attempts: input.status === "PROCESSING" ? { increment: 1 } : undefined,
      publishedAt: input.status === "PUBLISHED" ? new Date() : undefined,
      processedAt: input.status === "PROCESSED" ? new Date() : undefined,
      availableAt: retryAt,
    },
  });
}

export function getOutboxRetryAvailableAt(input: {
  attempts: number;
  now?: Date;
  seed: string;
}) {
  const now = input.now ?? new Date();

  return new Date(now.getTime() + getOutboxRetryDelayMs(input));
}

export function getOutboxRetryDelayMs(input: {
  attempts: number;
  seed: string;
}) {
  const attempts = Math.max(1, Math.floor(input.attempts));
  const baseDelayMs = Math.min(
    60 * 60_000,
    2 ** Math.min(attempts, 6) * 60_000,
  );
  const jitterWindowMs = Math.min(60_000, Math.floor(baseDelayMs * 0.1));
  const jitterMs =
    jitterWindowMs > 0 ? getDeterministicJitter(input.seed, jitterWindowMs) : 0;

  return Math.min(60 * 60_000, baseDelayMs + jitterMs);
}

function getDeterministicJitter(seed: string, windowMs: number) {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return hash % windowMs;
}

export async function recordJobRun(input: {
  name: string;
  outboxEventId?: string;
  status: "COMPLETED" | "FAILED" | "SKIPPED";
  attempts?: number;
  metadata?: Prisma.InputJsonValue;
  lastError?: string;
}) {
  return db.jobRun.create({
    data: {
      name: input.name,
      outboxEventId: input.outboxEventId,
      status: input.status,
      attempts: input.attempts ?? 1,
      metadata: input.metadata,
      lastError: input.lastError,
      finishedAt: new Date(),
    },
  });
}
