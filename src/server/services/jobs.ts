import type { OutboxEvent } from "@prisma/client";

import { searchProvider } from "~/server/adapters/search";
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

  if (event.type === BUSINESS_EVENTS.emailRequested) {
    await recordJobRun({
      name: event.type,
      outboxEventId: event.id,
      status: "SKIPPED",
      attempts: event.attempts + 1,
      metadata: {
        reason:
          "Transactional email is still sent synchronously until a production queue provider is configured.",
      },
    });

    return { status: "SKIPPED" as const };
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
