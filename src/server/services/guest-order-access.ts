import {
  createHmac,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { env } from "~/env";
import { notificationProvider } from "~/server/adapters/notifications";
import { db } from "~/server/db";
import {
  getOtpChallengeVerificationState,
  getOtpExpiresAt,
  getOtpResendWaitSeconds,
  hashOtp,
  normalizeOtpIdentifier,
  otpHashesMatch,
} from "~/server/services/customer-otp";

export const GUEST_ORDER_ACCESS_COOKIE = "elysia.guest-order-access";
export const GUEST_ORDER_ACCESS_MAX_AGE_SECONDS = 15 * 60;
const GUEST_ORDER_OTP_PURPOSE = "GUEST_ORDER_ACCESS";
const GENERIC_REQUEST_MESSAGE = "אם הפרטים תואמים להזמנה, קוד אימות נשלח כעת.";

export const requestGuestOrderAccessSchema = z.object({
  orderNumber: z.string().trim().min(3).max(64),
  identifier: z.string().trim().min(5).max(254),
});

export const verifyGuestOrderAccessSchema = z.object({
  challengeId: z.string().trim().min(8),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/),
});

type TokenPayload = { orderId: string; exp: number };

export function guestOrderIdentifierMatches(
  identifier: string,
  order: { email: string | null; phone: string | null },
) {
  const normalized = normalizeOtpIdentifier(identifier);

  return [order.email, order.phone]
    .filter((value): value is string => Boolean(value))
    .some((value) => normalizeOtpIdentifier(value) === normalized);
}

export function createGuestOrderAccessToken({
  now = new Date(),
  orderId,
  secret,
  ttlSeconds = GUEST_ORDER_ACCESS_MAX_AGE_SECONDS,
}: {
  now?: Date;
  orderId: string;
  secret: string;
  ttlSeconds?: number;
}) {
  const payload: TokenPayload = {
    orderId,
    exp: Math.floor(now.getTime() / 1000) + ttlSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret)
    .update(encoded)
    .digest("base64url");

  return `${encoded}.${signature}`;
}

export function verifyGuestOrderAccessToken(
  token: string,
  { now = new Date(), secret }: { now?: Date; secret: string },
) {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = createHmac("sha256", secret)
    .update(encoded)
    .digest("base64url");
  if (!safeEqual(signature, expected)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as Partial<TokenPayload>;
    if (
      typeof payload.orderId !== "string" ||
      typeof payload.exp !== "number" ||
      payload.exp <= Math.floor(now.getTime() / 1000)
    ) {
      return null;
    }

    return {
      orderId: payload.orderId,
      expiresAt: new Date(payload.exp * 1000),
    };
  } catch {
    return null;
  }
}

export async function requestGuestOrderAccess(
  input: z.infer<typeof requestGuestOrderAccessSchema>,
) {
  const parsed = requestGuestOrderAccessSchema.parse(input);
  const identifier = normalizeOtpIdentifier(parsed.identifier);
  const code = String(randomInt(100000, 1000000));
  const developmentCode =
    env.NODE_ENV !== "production" && !notificationProvider.isOperational()
      ? code
      : undefined;
  const order = await db.order.findFirst({
    where: {
      orderNumber: parsed.orderNumber,
    },
    select: { email: true, id: true, phone: true },
  });

  if (!order || !guestOrderIdentifierMatches(identifier, order)) {
    return {
      ok: true as const,
      challengeId: randomUUID(),
      message: GENERIC_REQUEST_MESSAGE,
      developmentCode,
    };
  }

  const channel = identifier.includes("@") ? "EMAIL" : "SMS";
  const latest = await db.otpChallenge.findFirst({
    where: { identifier, channel, purpose: GUEST_ORDER_OTP_PURPOSE },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  const waitSeconds = getOtpResendWaitSeconds(latest?.createdAt);
  if (waitSeconds > 0) {
    return {
      ok: true as const,
      challengeId: randomUUID(),
      message: GENERIC_REQUEST_MESSAGE,
      developmentCode,
    };
  }

  const challenge = await db.otpChallenge.create({
    data: {
      identifier,
      channel,
      codeHash: hashOtp(identifier, code),
      contextKey: order.id,
      purpose: GUEST_ORDER_OTP_PURPOSE,
      expiresAt: getOtpExpiresAt(),
    },
    select: { id: true },
  });
  await notificationProvider
    .sendOtp(identifier, code)
    .catch((error: unknown) => {
      console.error("[guest-order-access] failed to deliver OTP", error);
    });

  return {
    ok: true as const,
    challengeId: challenge.id,
    message: GENERIC_REQUEST_MESSAGE,
    developmentCode,
  };
}

export async function verifyGuestOrderAccess(
  input: z.infer<typeof verifyGuestOrderAccessSchema>,
) {
  const parsed = verifyGuestOrderAccessSchema.parse(input);

  return db.$transaction(async (tx) => {
    const challenge = await tx.otpChallenge.findFirst({
      where: { id: parsed.challengeId, purpose: GUEST_ORDER_OTP_PURPOSE },
    });
    const state = getOtpChallengeVerificationState(challenge);
    if (!challenge?.contextKey || state !== "valid") {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "הקוד אינו תקין או שפג תוקפו.",
      });
    }

    if (
      !otpHashesMatch(challenge.codeHash, challenge.identifier, parsed.code)
    ) {
      await tx.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "הקוד אינו תקין או שפג תוקפו.",
      });
    }

    await tx.otpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    });

    return {
      orderId: challenge.contextKey,
      token: createGuestOrderAccessToken({
        orderId: challenge.contextKey,
        secret: getAccessSecret(),
      }),
    };
  });
}

export async function getGuestOrderSummary(token?: string | null) {
  if (!token) return null;
  const access = verifyGuestOrderAccessToken(token, {
    secret: getAccessSecret(),
  });
  if (!access) return null;

  const order = await db.order.findUnique({
    where: { id: access.orderId },
    include: {
      items: { orderBy: { id: "asc" } },
      shipments: { orderBy: { shippedAt: "desc" }, take: 1 },
    },
  });
  if (!order) return null;

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    total: Number(order.total),
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    tracking: order.shipments[0]?.tracking ?? null,
    updatedAt: order.updatedAt.toISOString(),
  };
}

function getAccessSecret() {
  const secret = env.AUTH_SECRET;
  if (!secret)
    throw new Error("AUTH_SECRET is required for guest order access");
  return secret;
}

function safeEqual(value: string, expected: string) {
  const left = Buffer.from(value);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}
