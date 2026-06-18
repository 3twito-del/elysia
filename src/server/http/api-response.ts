import { NextResponse } from "next/server";

import type { RateLimitExceededError } from "~/server/services/rate-limit";

export function jsonResponse<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(toJsonSafeValue(data), init);
}

export function okJson<T>(data: T, init?: ResponseInit) {
  return jsonResponse(data, init);
}

export function errorJson(
  status: number,
  error = "Request failed.",
  init?: ResponseInit,
) {
  return jsonResponse(
    { ok: false, error },
    {
      ...init,
      status,
    },
  );
}

export function badRequestJson(error = "Invalid request.") {
  return errorJson(400, error);
}

export function payloadTooLargeJson(error = "Request body is too large.") {
  return errorJson(413, error);
}

export function notFoundJson(error = "Not found.") {
  return errorJson(404, error);
}

export function unauthorizedJson(error = "Unauthorized.") {
  return errorJson(401, error);
}

export function forbiddenJson(error = "Forbidden.") {
  return errorJson(403, error);
}

export function serviceUnavailableJson(error = "Service unavailable.") {
  return errorJson(503, error);
}

export function rateLimitedJson(
  error: RateLimitExceededError,
  message = "Too many requests.",
) {
  return errorJson(429, message, {
    headers: {
      "Retry-After": formatRetryAfterSeconds(error.retryAfterSeconds),
    },
  });
}

function formatRetryAfterSeconds(value: number) {
  return String(Math.max(1, Math.ceil(value)));
}

function toJsonSafeValue(
  value: unknown,
  seen = new WeakSet<object>(),
): unknown {
  if (value instanceof Date) return value.toISOString();

  if (typeof value === "bigint") return value.toString();

  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "number" ||
    typeof value === "string"
  ) {
    return value;
  }

  if (
    typeof value === "undefined" ||
    typeof value === "function" ||
    typeof value === "symbol"
  ) {
    return undefined;
  }

  if (Array.isArray(value)) {
    if (seen.has(value)) return "[Circular]";

    seen.add(value);

    const safeItems = value.map((item) => toJsonSafeValue(item, seen) ?? null);

    seen.delete(value);

    return safeItems;
  }

  if (typeof value === "object") {
    if (seen.has(value)) return "[Circular]";

    seen.add(value);

    const toJson = (value as { toJSON?: () => unknown }).toJSON;

    if (typeof toJson === "function") {
      const safeJsonValue = toJsonSafeValue(toJson.call(value), seen);

      seen.delete(value);

      return safeJsonValue;
    }

    const result: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      const safeValue = toJsonSafeValue(nestedValue, seen);

      if (typeof safeValue !== "undefined") {
        result[key] = safeValue;
      }
    }

    seen.delete(value);

    return result;
  }

  return value;
}
