import {
  createHash,
  createHmac,
  randomInt,
  timingSafeEqual,
} from "node:crypto";
import { TRPCError } from "@trpc/server";
import type { OtpChannel, Prisma } from "@prisma/client";
import { z } from "zod";

import { env } from "~/env";
import { notificationProvider } from "~/server/adapters/notifications";
import { db } from "~/server/db";

const CUSTOMER_SIGN_IN_OTP_PURPOSE = "CUSTOMER_SIGN_IN";

const OTP_TTL_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_HASH_SCHEME = "otp-hmac-sha256";

// Exported so ~/server/auth/config.ts's authorize() catch block can tell
// these three failure modes apart without re-verifying the code a second
// time (which would double-count the attempt / re-consume the challenge).
export const OTP_EXPIRED_MESSAGE = "הקוד פג תוקף. בקשי קוד חדש.";
export const OTP_LOCKED_MESSAGE = "בוצעו יותר מדי ניסיונות. בקשי קוד חדש.";
export const OTP_INVALID_MESSAGE = "קוד האימות אינו תקין.";
export const OTP_RESEND_COOLDOWN_MESSAGE = (seconds: number) =>
  `כבר נשלח קוד לאחרונה. אפשר לבקש קוד נוסף בעוד ${seconds} שניות.`;

type TransactionClient = Prisma.TransactionClient;

export const requestCustomerOtpInputSchema = z
  .object({
    identifier: z.string().trim().min(5),
    channel: z.enum(["EMAIL", "SMS"]),
  })
  .superRefine((input, ctx) => {
    const isEmail = input.identifier.includes("@");

    if (input.channel === "EMAIL" && !isEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "יש להזין כתובת אימייל עבור קוד במייל.",
        path: ["identifier"],
      });
    }

    if (input.channel === "SMS" && isEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "יש להזין מספר טלפון עבור קוד ב-SMS.",
        path: ["identifier"],
      });
    }
  });

export const verifyCustomerOtpInputSchema = z.object({
  identifier: z.string().trim().min(5),
  code: z.string().trim().min(4).max(8),
  sessionKey: z.string().trim().min(16).max(128).optional(),
});

export type RequestCustomerOtpInput = z.infer<
  typeof requestCustomerOtpInputSchema
>;

export type VerifyCustomerOtpInput = z.infer<
  typeof verifyCustomerOtpInputSchema
>;

export function normalizeOtpIdentifier(identifier: string) {
  const trimmed = identifier.trim();

  if (trimmed.includes("@")) {
    return trimmed.toLowerCase();
  }

  return trimmed.replace(/[^\d+]/g, "");
}

export function redactOtpIdentifierForMetadata(identifier: string) {
  const normalized = normalizeOtpIdentifier(identifier);

  if (!normalized) return "[redacted]";

  if (normalized.includes("@")) {
    const [localPart, domain] = normalized.split("@");
    const safeLocal = localPart ? `${localPart.slice(0, 1)}***` : "[redacted]";

    return domain ? `${safeLocal}@${domain}` : safeLocal;
  }

  const digits = normalized.replace(/\D/g, "");

  return digits.length >= 4 ? `***${digits.slice(-4)}` : "[redacted]";
}

export function hashOtp(identifier: string, code: string) {
  const secret = getOtpHashSecret();

  if (!secret) return hashLegacyOtp(identifier, code);

  return `${OTP_HASH_SCHEME}:${createHmac("sha256", secret)
    .update(`${normalizeOtpIdentifier(identifier)}:${code.trim()}`)
    .digest("hex")}`;
}

export function getOtpExpiresAt(now = new Date()) {
  return new Date(now.getTime() + OTP_TTL_MINUTES * 60_000);
}

export function getOtpResendWaitSeconds(
  latestCreatedAt: Date | null | undefined,
  now = new Date(),
) {
  if (!latestCreatedAt) return 0;

  const availableAt =
    latestCreatedAt.getTime() + OTP_RESEND_COOLDOWN_SECONDS * 1000;

  return Math.max(0, Math.ceil((availableAt - now.getTime()) / 1000));
}

export function getOtpChallengeVerificationState(
  challenge:
    | {
        attempts: number;
        consumedAt: Date | null;
        expiresAt: Date;
      }
    | null
    | undefined,
  now = new Date(),
) {
  if (!challenge || challenge.consumedAt) return "invalid";
  if (challenge.expiresAt <= now) return "expired";
  if (challenge.attempts >= MAX_OTP_ATTEMPTS) return "locked";

  return "valid";
}

export function otpHashesMatch(
  expectedHash: string,
  identifier: string,
  code: string,
) {
  if (expectedHash.startsWith(`${OTP_HASH_SCHEME}:`)) {
    return safeEqualHex(
      expectedHash.slice(`${OTP_HASH_SCHEME}:`.length),
      hashOtp(identifier, code).slice(`${OTP_HASH_SCHEME}:`.length),
    );
  }

  return safeEqualHex(expectedHash, hashLegacyOtp(identifier, code));
}

function hashLegacyOtp(identifier: string, code: string) {
  return createHash("sha256")
    .update(`${normalizeOtpIdentifier(identifier)}:${code.trim()}`)
    .digest("hex");
}

function safeEqualHex(expectedHash: string, actualHash: string) {
  const expected = Buffer.from(expectedHash, "hex");
  const actual = Buffer.from(actualHash, "hex");

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function getOtpHashSecret() {
  return env.AUTH_SECRET ?? (env.NODE_ENV === "production" ? undefined : "dev");
}

export async function requestCustomerOtp(input: RequestCustomerOtpInput) {
  const parsed = requestCustomerOtpInputSchema.parse(input);
  const identifier = normalizeOtpIdentifier(parsed.identifier);
  const code = String(randomInt(100000, 1000000));
  const now = new Date();
  const latestChallenge = await db.otpChallenge.findFirst({
    where: {
      identifier,
      channel: parsed.channel,
      purpose: CUSTOMER_SIGN_IN_OTP_PURPOSE,
    },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  const resendWaitSeconds = getOtpResendWaitSeconds(
    latestChallenge?.createdAt,
    now,
  );

  if (resendWaitSeconds > 0) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: OTP_RESEND_COOLDOWN_MESSAGE(resendWaitSeconds),
    });
  }

  const expiresAt = getOtpExpiresAt(now);

  await db.otpChallenge.create({
    data: {
      identifier,
      channel: parsed.channel,
      codeHash: hashOtp(identifier, code),
      expiresAt,
      purpose: CUSTOMER_SIGN_IN_OTP_PURPOSE,
    },
  });

  try {
    await notificationProvider.sendOtp(identifier, code);
  } catch (error) {
    await db.integrationJob.create({
      data: {
        provider: notificationProvider.providerName(),
        jobType: "customer_otp_delivery",
        status: "FAILED",
        attempts: 1,
        lastError: error instanceof Error ? error.message : "Unknown error",
        finishedAt: new Date(),
        payload: {
          identifier: redactOtpIdentifierForMetadata(identifier),
          channel: parsed.channel,
        },
      },
    });

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "לא ניתן לשלוח קוד כרגע. נסי שוב בעוד דקה.",
    });
  }

  return {
    ok: true,
    channel: parsed.channel,
    expiresInMinutes: OTP_TTL_MINUTES,
    deliveryProvider: notificationProvider.providerName(),
    developmentCode:
      env.NODE_ENV !== "production" && !notificationProvider.isOperational()
        ? code
        : undefined,
  };
}

export async function verifyCustomerOtp(input: VerifyCustomerOtpInput) {
  const parsed = verifyCustomerOtpInputSchema.parse(input);
  const identifier = normalizeOtpIdentifier(parsed.identifier);
  const now = new Date();

  return db.$transaction(async (tx) => {
    const challenge = await tx.otpChallenge.findFirst({
      where: {
        identifier,
        consumedAt: null,
        purpose: CUSTOMER_SIGN_IN_OTP_PURPOSE,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!challenge) {
      throw invalidOtpError();
    }

    const challengeState = getOtpChallengeVerificationState(challenge, now);

    if (challengeState === "invalid") {
      throw invalidOtpError();
    }

    if (challengeState === "expired") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: OTP_EXPIRED_MESSAGE,
      });
    }

    if (challengeState === "locked") {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: OTP_LOCKED_MESSAGE,
      });
    }

    if (!otpHashesMatch(challenge.codeHash, identifier, parsed.code)) {
      await tx.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });

      throw invalidOtpError();
    }

    const customer = await upsertCustomerIdentity(tx, identifier);

    if (parsed.sessionKey) {
      await tx.cart.updateMany({
        where: {
          sessionKey: parsed.sessionKey,
          status: "ACTIVE",
        },
        data: {
          customerId: customer.customerId,
          mergeMetadata: {
            mergedFromSessionKey: parsed.sessionKey,
            mergedAt: now.toISOString(),
            source: "customer_otp",
          },
        },
      });
    }

    await tx.otpChallenge.update({
      where: { id: challenge.id },
      data: {
        consumedAt: now,
        customerId: customer.customerId,
      },
    });

    return customer;
  });
}

async function upsertCustomerIdentity(
  tx: TransactionClient,
  identifier: string,
) {
  const channel: OtpChannel = identifier.includes("@") ? "EMAIL" : "SMS";

  if (channel === "EMAIL") {
    const user = await tx.user.upsert({
      where: { email: identifier },
      update: {},
      create: {
        email: identifier,
        name: identifier.split("@")[0],
      },
    });

    const customer = await tx.customer.upsert({
      where: { email: identifier },
      update: { userId: user.id },
      create: {
        email: identifier,
        userId: user.id,
      },
    });

    return {
      userId: user.id,
      customerId: customer.id,
      email: user.email,
      name: customer.firstName ?? user.name ?? "לקוח/ה Elysia",
    };
  }

  const existingCustomer = await tx.customer.findFirst({
    where: { phone: identifier },
    orderBy: { createdAt: "asc" },
  });

  if (existingCustomer?.userId) {
    const user = await tx.user.findUnique({
      where: { id: existingCustomer.userId },
    });

    return {
      userId: existingCustomer.userId,
      customerId: existingCustomer.id,
      email: user?.email ?? null,
      name: existingCustomer.firstName ?? user?.name ?? "לקוח/ה Elysia",
    };
  }

  const user = await tx.user.create({
    data: {
      name: identifier,
    },
  });

  const customer = existingCustomer
    ? await tx.customer.update({
        where: { id: existingCustomer.id },
        data: { userId: user.id },
      })
    : await tx.customer.create({
        data: {
          phone: identifier,
          userId: user.id,
        },
      });

  return {
    userId: user.id,
    customerId: customer.id,
    email: user.email,
    name: customer.firstName ?? user.name ?? "לקוח/ה Elysia",
  };
}

function invalidOtpError() {
  return new TRPCError({
    code: "BAD_REQUEST",
    message: OTP_INVALID_MESSAGE,
  });
}
