import { nanoid } from "nanoid";
import { z } from "zod";

import { env } from "~/env";

export const checkoutInputSchema = z.object({
  orderId: z.string(),
  orderNumber: z.string(),
  amount: z.number().positive(),
  currency: z.literal("ILS").default("ILS"),
  customerEmail: z.string().email(),
  returnUrl: z.string().url(),
});

export type CheckoutInput = z.infer<typeof checkoutInputSchema>;

export type CheckoutSession = {
  provider: "cardcom";
  providerPaymentId: string;
  redirectUrl: string;
  idempotencyKey: string;
};

export interface PaymentProvider {
  createCheckout(input: CheckoutInput): Promise<CheckoutSession>;
  verifyWebhook(payload: unknown, signature?: string): Promise<boolean>;
}

class CardComPaymentProvider implements PaymentProvider {
  async createCheckout(input: CheckoutInput): Promise<CheckoutSession> {
    const parsed = checkoutInputSchema.parse(input);
    const terminal = env.CARD_COM_TERMINAL;
    const hasCredentials =
      Boolean(terminal) &&
      Boolean(env.CARD_COM_API_NAME) &&
      Boolean(env.CARD_COM_API_PASSWORD);
    const paymentId = `cardcom_${nanoid(12)}`;

    if (!hasCredentials) {
      if (env.NODE_ENV === "production") {
        throw new Error(
          "CardCom production checkout requires CARD_COM_TERMINAL, CARD_COM_API_NAME, and CARD_COM_API_PASSWORD.",
        );
      }

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

  async verifyWebhook(payload: unknown, signature?: string) {
    if (!env.CARD_COM_API_PASSWORD) {
      if (env.NODE_ENV === "production") return false;

      return z
        .object({ provider: z.literal("cardcom").optional() })
        .safeParse(payload).success;
    }

    return Boolean(signature);
  }
}

export const paymentProvider: PaymentProvider = new CardComPaymentProvider();
