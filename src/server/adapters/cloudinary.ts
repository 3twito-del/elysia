import { createHash, timingSafeEqual } from "node:crypto";

import { env } from "~/env";

export function verifyCloudinarySignature(input: {
  rawBody: string;
  signature: string | null;
  secret?: string;
  nodeEnv?: string;
  nowMs?: number;
  timestamp: string | null;
}) {
  const secret = input.secret ?? env.CLOUDINARY_API_SECRET;

  if (!secret) {
    return (input.nodeEnv ?? env.NODE_ENV) !== "production";
  }

  if (!input.signature || !input.timestamp) return false;

  const timestampMs = Number(input.timestamp) * 1000;
  const nowMs = input.nowMs ?? Date.now();

  if (!Number.isFinite(timestampMs)) return false;

  const twoHoursMs = 2 * 60 * 60_000;

  if (Math.abs(nowMs - timestampMs) > twoHoursMs) return false;

  const signedPayload = `${input.rawBody}${input.timestamp}${secret}`;

  return ["sha1", "sha256"].some((algorithm) =>
    safeEqualHex(
      input.signature ?? "",
      createHash(algorithm).update(signedPayload).digest("hex"),
    ),
  );
}

function safeEqualHex(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}
