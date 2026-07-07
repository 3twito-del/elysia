import { createHash } from "node:crypto";

import { Prisma } from "@prisma/client";
import { z } from "zod";

import { env } from "~/env";
import { db } from "~/server/db";
import {
  hashAnalyticsIdentifier,
  isAnalyticsDatabaseUnavailableError,
  isAnalyticsIngestionEnabled,
  resolveAnalyticsIdentity,
  toNullableJsonInput,
} from "~/server/services/analytics";

// Per-node limits are generous because a single rrweb full-snapshot legitimately
// carries large strings (an inlined <style>'s CSS, a data: URI) and long arrays
// (a rich page's childNodes). The real bound is the overall payload: the route
// caps the request at 256 KB and the service rejects serialized events over
// 220 KB, so a chunk cannot approach these ceilings — they only stop a single
// pathological value. Tight limits here were silently 400-ing valid chunks.
const replayJsonSchema: z.ZodType<Prisma.JsonValue> = z.lazy(() =>
  z.union([
    z.string().max(262_144),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(replayJsonSchema).max(100_000),
    z.record(z.string().max(256), replayJsonSchema),
  ]),
);

const sensitiveReplayKeyPattern =
  /(email|e-mail|mail|phone|mobile|tel|address|street|city|postal|zip|token|secret|password|authorization|cookie|card|cvv|cc|iban|payment|credit|expiry|pan)/i;
const sensitiveReplayStringPattern =
  /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\b\d{3}[-\s]?\d{3}[-\s]?\d{4}\b|\b(?:\d[ -]*?){13,19}\b)/i;
const replayBlockedRoutePattern = /^\/admin(?:\/|$)/i;
const replaySensitiveRoutePattern = /^\/(?:account|checkout|service)(?:\/|$)/i;

export const analyticsReplayChunkInputSchema = z.object({
  sessionKey: z.string().trim().min(8).max(256),
  visitorKey: z.string().trim().min(8).max(256).optional(),
  visitorKeyHash: z.string().trim().min(16).max(128).optional(),
  sequence: z.number().int().nonnegative(),
  startedAt: z.coerce.date(),
  endedAt: z.coerce.date(),
  path: z.string().trim().max(512).optional(),
  url: z.string().trim().max(2_048).optional(),
  masked: z.literal(true).default(true),
  checksum: z.string().trim().min(8).max(128),
  events: z.array(replayJsonSchema).min(1).max(1_000),
});

export type AnalyticsReplayChunkInput = z.infer<
  typeof analyticsReplayChunkInputSchema
>;

export type AnalyticsReplayRecordResult =
  | { status: "accepted"; chunkId: string | null }
  | { status: "duplicate"; chunkId: null }
  | {
      status: "skipped";
      chunkId: null;
      reason: "disabled" | "database_unavailable" | "admin_route";
    }
  | {
      status: "rejected";
      chunkId: null;
      reason:
        | "invalid_time_range"
        | "invalid_checksum"
        | "payload_too_large"
        | "contains_unmasked_sensitive_data";
    };

export async function recordAnalyticsReplayChunk(
  input: AnalyticsReplayChunkInput,
): Promise<AnalyticsReplayRecordResult> {
  const parsed = analyticsReplayChunkInputSchema.parse(input);
  const path = normalizeReplayPath(parsed.path ?? parsed.url);

  if (!isAnalyticsIngestionEnabled()) {
    return { status: "skipped", chunkId: null, reason: "disabled" };
  }

  if (!env.DATABASE_URL) {
    return { status: "skipped", chunkId: null, reason: "database_unavailable" };
  }

  if (path && replayBlockedRoutePattern.test(path)) {
    return { status: "skipped", chunkId: null, reason: "admin_route" };
  }

  if (parsed.endedAt < parsed.startedAt) {
    return { status: "rejected", chunkId: null, reason: "invalid_time_range" };
  }

  const serializedEvents = JSON.stringify(parsed.events);
  const sizeBytes = Buffer.byteLength(serializedEvents, "utf8");

  if (sizeBytes > 220 * 1024) {
    return { status: "rejected", chunkId: null, reason: "payload_too_large" };
  }

  if (!isReplayChecksumAcceptable(parsed.checksum, serializedEvents)) {
    return { status: "rejected", chunkId: null, reason: "invalid_checksum" };
  }

  // We do NOT reject chunks that still contain PII-looking values: static page
  // text the client can't input-mask (a footer email, a "name@example.com"
  // placeholder that appears in the footer sitewide) would otherwise reject
  // every full-snapshot on every page. maskReplayEvents below is the real
  // safety net — it redacts sensitive strings and keys before storage — so we
  // mask rather than drop the session.
  const sessionKeyHash = hashAnalyticsIdentifier(parsed.sessionKey);
  const visitorKeyHash =
    parsed.visitorKeyHash ??
    (parsed.visitorKey ? hashAnalyticsIdentifier(parsed.visitorKey) : null);
  try {
    const identity = await resolveAnalyticsIdentity({
      occurredAt: parsed.endedAt,
      visitorKeyHash,
      sessionKeyHash,
      path,
      replayEnabled: true,
    });
    const maskedEvents = maskReplayEvents(parsed.events, {
      forceMaskText: Boolean(path && replaySensitiveRoutePattern.test(path)),
    });
    const chunk = await db.analyticsReplayChunk.create({
      data: {
        session: identity.sessionId
          ? { connect: { id: identity.sessionId } }
          : undefined,
        sessionKeyHash,
        sequence: parsed.sequence,
        startedAt: parsed.startedAt,
        endedAt: parsed.endedAt,
        eventCount: parsed.events.length,
        sizeBytes,
        checksum: parsed.checksum,
        masked: true,
        events: toNullableJsonInput(maskedEvents) ?? [],
      },
      select: { id: true },
    });

    return { status: "accepted", chunkId: chunk.id };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { status: "duplicate", chunkId: null };
    }

    if (isAnalyticsDatabaseUnavailableError(error)) {
      return {
        status: "skipped",
        chunkId: null,
        reason: "database_unavailable",
      };
    }

    throw error;
  }
}

export async function listRecentReplaySessions(input: { take?: number } = {}) {
  return db.analyticsSession.findMany({
    where: {
      replayChunks: {
        some: {},
      },
    },
    orderBy: { lastSeenAt: "desc" },
    take: Math.min(Math.max(input.take ?? 20, 1), 50),
    select: {
      id: true,
      startedAt: true,
      lastSeenAt: true,
      entryPath: true,
      exitPath: true,
      referrer: true,
      utm: true,
      device: true,
      eventCount: true,
      visitor: {
        select: {
          id: true,
          firstPath: true,
        },
      },
      _count: {
        select: {
          replayChunks: true,
          events: true,
        },
      },
    },
  });
}

export async function getReplaySessionForAdmin(input: {
  sessionId: string;
  adminUserId: string;
}) {
  const session = await db.analyticsSession.findUnique({
    where: { id: input.sessionId },
    select: {
      id: true,
      startedAt: true,
      lastSeenAt: true,
      entryPath: true,
      exitPath: true,
      referrer: true,
      utm: true,
      device: true,
      eventCount: true,
      replayChunks: {
        orderBy: { sequence: "asc" },
        select: {
          id: true,
          sequence: true,
          startedAt: true,
          endedAt: true,
          eventCount: true,
          events: true,
        },
      },
    },
  });

  if (!session) return null;

  await db.auditLog.create({
    data: {
      adminUserId: input.adminUserId,
      action: "ANALYTICS_REPLAY_VIEWED",
      entity: "AnalyticsSession",
      entityId: session.id,
      metadata: {
        chunks: session.replayChunks.length,
        entryPath: session.entryPath,
        exitPath: session.exitPath,
      },
    },
  });

  return session;
}

export function maskReplayEvents(
  events: Prisma.JsonValue[],
  input: { forceMaskText?: boolean } = {},
): Prisma.JsonValue[] {
  return events.map((event) => maskReplayValue(event, 0, input));
}

export function containsUnmaskedSensitiveData(value: Prisma.JsonValue) {
  return findSensitiveReplayValue(value, 0);
}

function maskReplayValue(
  value: Prisma.JsonValue,
  depth: number,
  input: { forceMaskText?: boolean },
): Prisma.JsonValue {
  if (depth > 10) return "[masked:max-depth]";

  if (Array.isArray(value)) {
    return value
      .slice(0, 1_000)
      .map((item) => maskReplayValue(item, depth + 1, input));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => {
        if (sensitiveReplayKeyPattern.test(key)) return [key, "[masked]"];

        if (
          input.forceMaskText &&
          (key === "textContent" || key === "text" || key === "nodeValue")
        ) {
          return [key, "[masked]"];
        }

        return [
          key,
          maskReplayValue(nestedValue as Prisma.JsonValue, depth + 1, input),
        ];
      }),
    );
  }

  if (typeof value === "string") {
    if (sensitiveReplayStringPattern.test(value)) return "[masked]";

    return input.forceMaskText ? "[masked]" : value.slice(0, 10_000);
  }

  return value;
}

function findSensitiveReplayValue(
  value: Prisma.JsonValue,
  depth: number,
): boolean {
  if (depth > 10) return false;

  if (Array.isArray(value)) {
    return value.some((item) => findSensitiveReplayValue(item, depth + 1));
  }

  if (value && typeof value === "object") {
    return Object.entries(value).some(([key, nestedValue]) => {
      if (sensitiveReplayKeyPattern.test(key)) return true;

      return findSensitiveReplayValue(
        nestedValue as Prisma.JsonValue,
        depth + 1,
      );
    });
  }

  return typeof value === "string" && sensitiveReplayStringPattern.test(value);
}

function isReplayChecksumAcceptable(
  checksum: string,
  serializedEvents: string,
) {
  const sha256 = createHash("sha256").update(serializedEvents).digest("hex");

  return checksum === sha256 || checksum === "client-unavailable";
}

function normalizeReplayPath(value?: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value, "https://elysia.local");

    return `${url.pathname}${url.search}`;
  } catch {
    return value.startsWith("/") ? value : null;
  }
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}
