import { z } from "zod";

import { db } from "~/server/db";
import {
  getOtpExpiresAt,
  hashOtp,
  normalizeOtpIdentifier,
} from "~/server/services/customer-otp";

export const CUSTOMER_AUTH_FIXTURE_FLAG = "E2E_AUTH_FIXTURES";
export const CUSTOMER_AUTH_FIXTURE_DEFAULTS = {
  code: "424242",
  email: "e2e.customer@elysia.local",
  localOrderNumber: "E2E-LOCAL-1001",
  sessionKey: "e2e_customer_auth_fixture_session",
  shopifyOrderId: "gid://shopify/Order/e2e-customer-fixture",
  shopifyOrderName: "#E2E-SHOPIFY-1001",
} as const;

const customerAuthFixtureInputSchema = z.object({
  email: z.string().trim().email().optional(),
  sessionKey: z.string().trim().min(16).max(128).optional(),
});

export class CustomerAuthFixturesDisabledError extends Error {
  constructor() {
    super("Customer auth fixtures are disabled.");
    this.name = "CustomerAuthFixturesDisabledError";
  }
}

export function shouldUseCustomerAuthFixtures(
  env: Record<string, string | undefined> = process.env,
) {
  return (
    env[CUSTOMER_AUTH_FIXTURE_FLAG] === "1" &&
    !(env.VERCEL === "1" && env.VERCEL_ENV === "production")
  );
}

export function parseCustomerAuthFixtureInput(input: unknown) {
  const parsed = customerAuthFixtureInputSchema.parse(input ?? {});

  return {
    email: normalizeOtpIdentifier(
      parsed.email ?? CUSTOMER_AUTH_FIXTURE_DEFAULTS.email,
    ),
    sessionKey: parsed.sessionKey ?? CUSTOMER_AUTH_FIXTURE_DEFAULTS.sessionKey,
  };
}

export async function createCustomerAuthFixture(input: unknown = {}) {
  if (!shouldUseCustomerAuthFixtures()) {
    throw new CustomerAuthFixturesDisabledError();
  }

  const fixtureInput = parseCustomerAuthFixtureInput(input);
  const now = new Date();
  const paidAt = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
  const preparingAt = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const shippedAt = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  return db.$transaction(async (tx) => {
    const variant = await tx.productVariant.findFirst({
      where: {
        product: {
          slug: "hera-bracelet",
        },
      },
      include: {
        prices: {
          orderBy: { validFrom: "desc" },
          take: 1,
        },
        product: {
          include: {
            category: true,
            material: true,
            stone: true,
          },
        },
      },
    });

    if (!variant) {
      throw new Error(
        "Customer auth fixture requires the seeded hera-bracelet variant.",
      );
    }

    const unitPrice =
      Number(variant.prices[0]?.amount ?? variant.product.basePrice) +
      Number(variant.priceDelta);
    const shippingTotal = 35;
    const total = unitPrice + shippingTotal;
    const identifier = fixtureInput.email;
    const user = await tx.user.upsert({
      where: { email: identifier },
      update: { name: "E2E Customer" },
      create: {
        email: identifier,
        name: "E2E Customer",
      },
    });
    const customer = await tx.customer.upsert({
      where: { email: identifier },
      update: {
        firstName: "E2E",
        lastName: "Customer",
        phone: "0501234567",
        userId: user.id,
      },
      create: {
        email: identifier,
        firstName: "E2E",
        lastName: "Customer",
        phone: "0501234567",
        userId: user.id,
      },
    });

    await tx.customerAddress.deleteMany({
      where: { customerId: customer.id },
    });
    await tx.customerAddress.create({
      data: {
        customerId: customer.id,
        city: "Tel Aviv",
        isDefault: true,
        label: "E2E delivery",
        phone: "0501234567",
        postalCode: "6100001",
        recipient: "E2E Customer",
        street: "Fixture 1",
      },
    });
    await tx.savedSize.upsert({
      where: {
        customerId_kind: {
          customerId: customer.id,
          kind: "bracelet",
        },
      },
      update: { value: "M" },
      create: {
        customerId: customer.id,
        kind: "bracelet",
        value: "M",
      },
    });

    const wishlist = await tx.wishlist.upsert({
      where: { customerId: customer.id },
      update: {},
      create: { customerId: customer.id },
    });

    await tx.wishlistItem.deleteMany({
      where: { wishlistId: wishlist.id },
    });
    await tx.wishlistItem.create({
      data: {
        variantId: variant.id,
        wishlistId: wishlist.id,
      },
    });

    const existingOrder = await tx.order.findUnique({
      where: { orderNumber: CUSTOMER_AUTH_FIXTURE_DEFAULTS.localOrderNumber },
      select: { id: true },
    });

    if (existingOrder) {
      await tx.returnRequest.deleteMany({
        where: { orderId: existingOrder.id },
      });
      await tx.shipment.deleteMany({ where: { orderId: existingOrder.id } });
      await tx.payment.deleteMany({ where: { orderId: existingOrder.id } });
      await tx.orderItem.deleteMany({ where: { orderId: existingOrder.id } });
    }

    const localOrder = await tx.order.upsert({
      where: { orderNumber: CUSTOMER_AUTH_FIXTURE_DEFAULTS.localOrderNumber },
      update: {
        completedAt: null,
        currency: "ILS",
        customerId: customer.id,
        discountTotal: 0,
        email: identifier,
        fulfillmentMethod: "DELIVERY",
        paidAt,
        phone: "0501234567",
        preparingAt,
        readyForPickupAt: null,
        recipientName: "E2E Customer",
        refundedAt: null,
        shippedAt,
        shippingAddress: {
          city: "Tel Aviv",
          phone: "0501234567",
          recipient: "E2E Customer",
          street: "Fixture 1",
        },
        shippingTotal,
        status: "SHIPPED",
        subtotal: unitPrice,
        total,
      },
      create: {
        orderNumber: CUSTOMER_AUTH_FIXTURE_DEFAULTS.localOrderNumber,
        currency: "ILS",
        customerId: customer.id,
        discountTotal: 0,
        email: identifier,
        fulfillmentMethod: "DELIVERY",
        paidAt,
        phone: "0501234567",
        preparingAt,
        recipientName: "E2E Customer",
        shippedAt,
        shippingAddress: {
          city: "Tel Aviv",
          phone: "0501234567",
          recipient: "E2E Customer",
          street: "Fixture 1",
        },
        shippingTotal,
        status: "SHIPPED",
        subtotal: unitPrice,
        total,
      },
    });

    await tx.orderItem.create({
      data: {
        name: `${variant.product.name} / ${variant.name}`,
        orderId: localOrder.id,
        quantity: 1,
        sku: variant.sku,
        unitPrice,
        variantId: variant.id,
      },
    });
    await tx.payment.create({
      data: {
        amount: total,
        capturedAt: paidAt,
        currency: "ILS",
        idempotencyKey: `e2e_customer_fixture_payment_${localOrder.id}`,
        orderId: localOrder.id,
        provider: "fixture",
        providerPaymentId: "e2e-payment-1001",
        providerStatus: "captured",
        rawPayload: { fixture: "customer-auth" },
        status: "CAPTURED",
      },
    });
    await tx.shipment.create({
      data: {
        deliveredAt: null,
        orderId: localOrder.id,
        provider: "E2E Delivery",
        shippedAt,
        status: "SHIPPED",
        tracking: "E2E-TRACK-1001",
      },
    });
    await tx.returnRequest.create({
      data: {
        notes: "Fixture return request for authenticated account review.",
        orderId: localOrder.id,
        reason: "Fixture return state",
        status: "REQUESTED",
      },
    });

    await tx.shopifyOrderMirror.upsert({
      where: { shopifyOrderId: CUSTOMER_AUTH_FIXTURE_DEFAULTS.shopifyOrderId },
      update: {
        currency: "ILS",
        customerEmail: identifier,
        financialStatus: "PAID",
        fulfillmentStatus: "FULFILLED",
        lineItems: [
          {
            quantity: 1,
            sku: "E2E-SUPPLIER-001",
            title: "Supplier fixture ring",
          },
        ],
        processedAt: shippedAt,
        rawPayload: { fixture: "customer-auth" },
        shopifyOrderName: CUSTOMER_AUTH_FIXTURE_DEFAULTS.shopifyOrderName,
        supplierKey: "fixture-supplier",
        total: 420,
      },
      create: {
        shopifyOrderId: CUSTOMER_AUTH_FIXTURE_DEFAULTS.shopifyOrderId,
        currency: "ILS",
        customerEmail: identifier,
        financialStatus: "PAID",
        fulfillmentStatus: "FULFILLED",
        lineItems: [
          {
            quantity: 1,
            sku: "E2E-SUPPLIER-001",
            title: "Supplier fixture ring",
          },
        ],
        processedAt: shippedAt,
        rawPayload: { fixture: "customer-auth" },
        shopifyOrderName: CUSTOMER_AUTH_FIXTURE_DEFAULTS.shopifyOrderName,
        supplierKey: "fixture-supplier",
        total: 420,
      },
    });

    await tx.otpChallenge.deleteMany({
      where: {
        consumedAt: null,
        identifier,
      },
    });
    await tx.otpChallenge.create({
      data: {
        channel: "EMAIL",
        codeHash: hashOtp(identifier, CUSTOMER_AUTH_FIXTURE_DEFAULTS.code),
        customerId: customer.id,
        expiresAt: getOtpExpiresAt(now),
        identifier,
      },
    });

    return {
      code: CUSTOMER_AUTH_FIXTURE_DEFAULTS.code,
      customerId: customer.id,
      email: identifier,
      localOrderId: localOrder.id,
      localOrderNumber: localOrder.orderNumber,
      sessionKey: fixtureInput.sessionKey,
      shopifyOrderName: CUSTOMER_AUTH_FIXTURE_DEFAULTS.shopifyOrderName,
      userId: user.id,
    };
  });
}
