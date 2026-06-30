import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import type { Prisma } from "@prisma/client";

import { db } from "~/server/db";
import { toDisplayString } from "~/lib/stringify";

/**
 * API key management for the internal API platform (IPL-002). Keys are stored as
 * a SHA-256 hash plus a public prefix; the plaintext is returned exactly once at
 * issue time. The hashing, masking, scope and expiry helpers are pure + tested.
 */

export const API_SCOPES = [
  "catalog:read",
  "orders:read",
  "orders:write",
  "inventory:read",
  "inventory:write",
  "customers:read",
  "reports:read",
] as const;

export type ApiScope = (typeof API_SCOPES)[number];

/** SHA-256 hex hash of a plaintext key. Pure. */
export function hashApiKey(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

/** Public masked representation of a key from its prefix. Pure. */
export function maskApiKey(prefix: string): string {
  return `elys_${prefix}_••••••••`;
}

/** Extracts the prefix from a plaintext key (`elys_<prefix>_<secret>`). Pure. */
export function parseKeyPrefix(plaintext: string): string | null {
  const parts = plaintext.split("_");
  if (parts.length < 3 || parts[0] !== "elys") return null;
  return parts[1] ?? null;
}

/** Validates requested scopes against the known set. Pure. */
export function validateScopes(scopes: unknown): string[] {
  if (!Array.isArray(scopes) || scopes.length === 0) {
    return ["יש לבחור לפחות הרשאה אחת."];
  }
  const known = new Set<string>(API_SCOPES);
  return scopes
    .filter((scope) => !known.has(toDisplayString(scope)))
    .map((scope) => `הרשאה לא מוכרת: ${toDisplayString(scope)}.`);
}

/** Whether a key is expired at a given moment. Pure. */
export function isKeyExpired(
  expiresAt: Date | null | undefined,
  now: Date = new Date(),
): boolean {
  return expiresAt != null && expiresAt.getTime() <= now.getTime();
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function generateKeyMaterial() {
  const prefix = randomBytes(4).toString("hex"); // 8 chars
  const secret = randomBytes(24).toString("hex");
  const plaintext = `elys_${prefix}_${secret}`;
  return { prefix, plaintext, hashedKey: hashApiKey(plaintext) };
}

const asJson = (value: unknown) => value as Prisma.InputJsonValue;

function parseScopes(value: Prisma.JsonValue | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((scope) => toDisplayString(scope));
}

/** Issues a new API key, returning the plaintext once. */
export async function issueApiKey(input: {
  name: string;
  scopes: string[];
  rateLimitPerMin?: number;
  expiresAt?: Date;
}) {
  if (!input.name.trim()) throw new Error("שם המפתח הוא שדה חובה.");

  const scopeErrors = validateScopes(input.scopes);
  if (scopeErrors.length > 0) throw new Error(scopeErrors.join(" "));

  const material = generateKeyMaterial();
  const key = await db.apiKey.create({
    data: {
      name: input.name.trim(),
      prefix: material.prefix,
      hashedKey: material.hashedKey,
      scopes: asJson(input.scopes),
      rateLimitPerMin: Math.max(1, Math.trunc(input.rateLimitPerMin ?? 120)),
      expiresAt: input.expiresAt,
    },
  });

  return {
    id: key.id,
    name: key.name,
    prefix: key.prefix,
    plaintext: material.plaintext,
  };
}

export async function revokeApiKey(input: { apiKeyId: string }) {
  return db.apiKey.update({
    where: { id: input.apiKeyId },
    data: { isActive: false },
  });
}

/**
 * Verifies a presented plaintext key. Returns its id + scopes when valid (active,
 * unexpired, hash matches), else null. Touches lastUsedAt on success.
 */
export async function verifyApiKey(plaintext: string) {
  const prefix = parseKeyPrefix(plaintext);
  if (!prefix) return null;

  const key = await db.apiKey.findUnique({ where: { prefix } });
  if (!key?.isActive) return null;
  if (isKeyExpired(key.expiresAt)) return null;
  if (!timingSafeEqualHex(key.hashedKey, hashApiKey(plaintext))) return null;

  await db.apiKey.update({
    where: { id: key.id },
    data: { lastUsedAt: new Date() },
  });

  return { apiKeyId: key.id, scopes: parseScopes(key.scopes) };
}

export async function recordApiRequest(input: {
  apiKeyId?: string;
  method: string;
  path: string;
  status: number;
  durationMs?: number;
}) {
  return db.apiRequestLog.create({
    data: {
      apiKeyId: input.apiKeyId,
      method: input.method,
      path: input.path,
      status: input.status,
      durationMs: Math.max(0, Math.trunc(input.durationMs ?? 0)),
    },
  });
}

export async function listApiKeys() {
  const keys = await db.apiKey.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      prefix: true,
      scopes: true,
      rateLimitPerMin: true,
      isActive: true,
      lastUsedAt: true,
      expiresAt: true,
      _count: { select: { requestLogs: true } },
    },
  });

  return keys.map((key) => ({
    id: key.id,
    name: key.name,
    masked: maskApiKey(key.prefix),
    scopes: parseScopes(key.scopes),
    rateLimitPerMin: key.rateLimitPerMin,
    isActive: key.isActive,
    expired: isKeyExpired(key.expiresAt),
    lastUsedAt: key.lastUsedAt,
    requestCount: key._count.requestLogs,
  }));
}

export async function listApiRequests(limit = 15) {
  const logs = await db.apiRequestLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      method: true,
      path: true,
      status: true,
      durationMs: true,
      createdAt: true,
      apiKey: { select: { name: true } },
    },
  });

  return logs.map((log) => ({
    id: log.id,
    method: log.method,
    path: log.path,
    status: log.status,
    durationMs: log.durationMs,
    createdAt: log.createdAt,
    keyName: log.apiKey?.name ?? "—",
  }));
}

export async function getApiSummary() {
  const [total, active, requests, errors] = await Promise.all([
    db.apiKey.count(),
    db.apiKey.count({ where: { isActive: true } }),
    db.apiRequestLog.count(),
    db.apiRequestLog.count({ where: { status: { gte: 400 } } }),
  ]);

  return { total, active, requests, errors };
}
