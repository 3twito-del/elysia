import { createHmac, timingSafeEqual } from "node:crypto";

import { nanoid } from "nanoid";
import { z } from "zod";

import { env } from "~/env";

export const checkoutInputSchema = z.object({
  orderId: z.string().trim().min(1).max(128),
  orderNumber: z.string().trim().min(3).max(64),
  amount: z.number().positive(),
  currency: z.literal("ILS").default("ILS"),
  customerEmail: z.string().email(),
  returnUrl: z.string().url().max(2_048),
});

export type CheckoutInput = z.infer<typeof checkoutInputSchema>;

export type CheckoutSession = {
  provider: "cardcom";
  providerPaymentId: string;
  redirectUrl: string;
  idempotencyKey: string;
};

export type WebhookVerificationInput = {
  payload: unknown;
  rawBody: string;
  signature?: string;
  timestamp?: string;
};

export interface PaymentProvider {
  createCheckout(input: CheckoutInput): Promise<CheckoutSession>;
  verifyWebhook(input: WebhookVerificationInput): Promise<boolean>;
}

export type CardComPaymentEnv = {
  CARD_COM_API_NAME?: string;
  CARD_COM_API_PASSWORD?: string;
  CARD_COM_TERMINAL?: string;
  NODE_ENV: string;
};

export const CARD_COM_PRODUCTION_CHECKOUT_ERROR =
  "CardCom production checkout requires CARD_COM_TERMINAL, CARD_COM_API_NAME, and CARD_COM_API_PASSWORD.";

export function hasCardComCheckoutCredentials(config: CardComPaymentEnv = env) {
  return Boolean(
    config.CARD_COM_TERMINAL?.trim() &&
    config.CARD_COM_API_NAME?.trim() &&
    config.CARD_COM_API_PASSWORD?.trim(),
  );
}

export function assertCardComCheckoutConfigured(
  config: CardComPaymentEnv = env,
) {
  const hasCredentials = hasCardComCheckoutCredentials(config);

  if (!hasCredentials && config.NODE_ENV === "production") {
    throw new Error(CARD_COM_PRODUCTION_CHECKOUT_ERROR);
  }

  return hasCredentials;
}

class CardComPaymentProvider implements PaymentProvider {
  async createCheckout(input: CheckoutInput): Promise<CheckoutSession> {
    const parsed = checkoutInputSchema.parse(input);
    const terminal = env.CARD_COM_TERMINAL;
    const hasCredentials = assertCardComCheckoutConfigured();
    const paymentId = `cardcom_${nanoid(12)}`;

    if (!hasCredentials) {
      return {
        provider: "cardcom",
        providerPaymentId: paymentId,
        redirectUrl: `/checkout/mock-payment?order=${parsed.orderNumber}`,
        idempotencyKey: `checkout_${parsed.orderId}_${paymentId}`,
      };
    }

    return {
      provider: "cardcom",
      providerPaymentId: paymentId,
      redirectUrl: `https://secure.cardcom.solutions/Interface/LowProfile.aspx?terminal=${terminal}&sum=${parsed.amount}`,
      idempotencyKey: `checkout_${parsed.orderId}_${paymentId}`,
    };
  }

  async verifyWebhook(input: WebhookVerificationInput) {
    if (!env.CARD_COM_API_PASSWORD) {
      if (env.NODE_ENV === "production") return false;

      return z
        .object({ provider: z.literal("cardcom").optional() })
        .safeParse(input.payload).success;
    }

    return verifyCardComWebhookSignature({
      rawBody: input.rawBody,
      secret: env.CARD_COM_WEBHOOK_SECRET,
      signature: input.signature,
      timestamp: input.timestamp,
    });
  }
}

export const paymentProvider: PaymentProvider = new CardComPaymentProvider();

export function verifyCardComWebhookSignature(input: {
  rawBody: string;
  secret?: string;
  signature?: string;
  timestamp?: string;
  nowMs?: number;
}) {
  const secret = input.secret?.trim();
  const signature = normalizeWebhookSignature(input.signature);

  if (!secret || !signature) return false;

  if (input.timestamp) {
    const timestampMs = Number(input.timestamp) * 1000;
    const nowMs = input.nowMs ?? Date.now();
    const fiveMinutesMs = 5 * 60_000;

    if (!Number.isFinite(timestampMs)) return false;
    if (Math.abs(nowMs - timestampMs) > fiveMinutesMs) return false;
  }

  return createCardComSignaturePayloads(input.rawBody, input.timestamp).some(
    (payload) =>
      safeEqualString(
        signature,
        createHmac("sha256", secret).update(payload).digest("hex"),
      ) ||
      safeEqualString(
        signature,
        createHmac("sha256", secret).update(payload).digest("base64"),
      ),
  );
}

function createCardComSignaturePayloads(
  rawBody: string,
  timestamp: string | undefined,
) {
  return timestamp ? [rawBody, `${timestamp}.${rawBody}`] : [rawBody];
}

function normalizeWebhookSignature(signature: string | undefined) {
  if (!signature) return null;

  return signature.trim().replace(/^sha256=/i, "");
}

function safeEqualString(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}
