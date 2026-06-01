import webPush from "web-push";
import { z } from "zod";

import { env } from "~/env";
import {
  normalizeInternalPushTargetUrl,
  pushCampaignSegments,
} from "~/lib/push-campaign-preview";
import { db } from "~/server/db";
import { BUSINESS_EVENTS, enqueueOutboxEvent } from "~/server/services/outbox";

export {
  createPushCampaignDryRunPreview,
  pushCampaignSegments,
} from "~/lib/push-campaign-preview";

const pushPayloadSchema = z.object({
  body: z.string().trim().min(1).max(180),
  tag: z.string().trim().max(120).optional(),
  title: z.string().trim().min(1).max(80),
  url: z.string().trim().min(1).max(1024).default("/"),
});

export const pushSubscriptionInputSchema = z.object({
  auth: z.string().trim().min(8).max(512),
  customerId: z.string().trim().min(1).optional(),
  deviceId: z.string().trim().min(8).max(128).optional(),
  endpoint: z.string().url().max(2048),
  marketingOptIn: z.boolean().default(false),
  p256dh: z.string().trim().min(8).max(512),
  productSlug: z.string().trim().min(1).max(120).optional(),
  sessionKey: z.string().trim().min(16).max(128).optional(),
  transactionalOptIn: z.boolean().default(true),
  userAgent: z.string().trim().max(512).optional(),
});

export const pushPreferencesInputSchema = z.object({
  deviceId: z.string().trim().min(8).max(128).optional(),
  endpoint: z.string().url().max(2048).optional(),
  marketingOptIn: z.boolean().optional(),
  transactionalOptIn: z.boolean().optional(),
});

export const pushCampaignInputSchema = z.object({
  body: z.string().trim().min(1).max(180),
  scheduledAt: z.coerce.date().optional(),
  segment: z.enum(pushCampaignSegments).default("MARKETING_OPT_IN"),
  targetUrl: z.string().trim().min(1).max(1024),
  title: z.string().trim().min(1).max(80),
});

let vapidConfigured = false;

export function isPushConfigured() {
  return Boolean(getVapidPublicKey() && env.VAPID_PRIVATE_KEY);
}

export function getVapidPublicKey() {
  return env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? env.VAPID_PUBLIC_KEY;
}

export async function upsertPushSubscription(
  input: z.infer<typeof pushSubscriptionInputSchema>,
) {
  const parsed = pushSubscriptionInputSchema.parse(input);
  const subscription = await db.pushSubscription.upsert({
    where: { endpoint: parsed.endpoint },
    update: {
      auth: parsed.auth,
      customerId: parsed.customerId,
      deviceId: parsed.deviceId,
      lastSeenAt: new Date(),
      marketingOptIn: parsed.marketingOptIn,
      p256dh: parsed.p256dh,
      revokedAt: null,
      sessionKey: parsed.sessionKey,
      status: "ACTIVE",
      transactionalOptIn: parsed.transactionalOptIn,
      userAgent: parsed.userAgent,
    },
    create: {
      auth: parsed.auth,
      customerId: parsed.customerId,
      deviceId: parsed.deviceId,
      endpoint: parsed.endpoint,
      marketingOptIn: parsed.marketingOptIn,
      p256dh: parsed.p256dh,
      sessionKey: parsed.sessionKey,
      transactionalOptIn: parsed.transactionalOptIn,
      userAgent: parsed.userAgent,
    },
  });

  if (parsed.productSlug) {
    await recordProductPushInterest({
      productSlug: parsed.productSlug,
      subscriptionId: subscription.id,
    });
  }

  return subscription;
}

export async function getPushCustomerIdForUser(userId: string) {
  const customer = await db.customer.findUnique({
    where: { userId },
    select: { id: true },
  });

  return customer?.id;
}

export async function updatePushPreferencesFromOffline(payload: unknown) {
  const parsed = pushPreferencesInputSchema.parse(payload);

  return updatePushPreferences(parsed);
}

export async function updatePushPreferences(
  input: z.infer<typeof pushPreferencesInputSchema>,
) {
  const parsed = pushPreferencesInputSchema.parse(input);

  if (!parsed.endpoint && !parsed.deviceId) {
    throw new Error("Missing push subscription identifier.");
  }

  return db.pushSubscription.updateMany({
    where: {
      ...(parsed.endpoint ? { endpoint: parsed.endpoint } : {}),
      ...(parsed.deviceId ? { deviceId: parsed.deviceId } : {}),
      status: "ACTIVE",
    },
    data: {
      marketingOptIn: parsed.marketingOptIn,
      transactionalOptIn: parsed.transactionalOptIn,
    },
  });
}

export async function revokePushSubscription(input: {
  deviceId?: string;
  endpoint?: string;
}) {
  if (!input.endpoint && !input.deviceId) {
    throw new Error("Missing push subscription identifier.");
  }

  return db.pushSubscription.updateMany({
    where: {
      ...(input.endpoint ? { endpoint: input.endpoint } : {}),
      ...(input.deviceId ? { deviceId: input.deviceId } : {}),
    },
    data: {
      marketingOptIn: false,
      revokedAt: new Date(),
      status: "REVOKED",
      transactionalOptIn: false,
    },
  });
}

export async function recordProductPushInterest(input: {
  productSlug: string;
  subscriptionId: string;
}) {
  const product = await db.product.findFirst({
    where: { slug: input.productSlug, status: "ACTIVE" },
    select: { id: true },
  });

  if (!product) return null;

  return db.productPushInterest.upsert({
    where: {
      productId_subscriptionId_kind: {
        kind: "BACK_IN_STOCK",
        productId: product.id,
        subscriptionId: input.subscriptionId,
      },
    },
    update: {
      status: "ACTIVE",
    },
    create: {
      kind: "BACK_IN_STOCK",
      productId: product.id,
      subscriptionId: input.subscriptionId,
    },
  });
}

export async function createPushCampaign(
  input: z.infer<typeof pushCampaignInputSchema>,
) {
  const parsed = pushCampaignInputSchema.parse(input);
  const targetUrl = assertInternalPushTargetUrl(parsed.targetUrl);

  const campaign = await db.pushCampaign.create({
    data: {
      body: parsed.body,
      scheduledAt: parsed.scheduledAt,
      segment: parsed.segment,
      status: parsed.scheduledAt ? "SCHEDULED" : "DRAFT",
      targetUrl,
      title: parsed.title,
    },
  });

  return campaign;
}

export async function listPushCampaigns() {
  return db.pushCampaign.findMany({
    include: {
      deliveries: {
        select: { status: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getPushCampaignAudienceSummary() {
  const entries = await Promise.all(
    pushCampaignSegments.map(async (segment) => [
      segment,
      await db.pushSubscription.count({
        where: getCampaignSubscriptionWhere(segment),
      }),
    ]),
  );

  return Object.fromEntries(entries) as Record<
    (typeof pushCampaignSegments)[number],
    number
  >;
}

export async function enqueuePushCampaign(
  campaignId: string,
  availableAt?: Date,
) {
  return enqueueOutboxEvent({
    aggregateId: campaignId,
    aggregateType: "PushCampaign",
    idempotencyKey: `${BUSINESS_EVENTS.pushCampaignRequested}:${campaignId}`,
    availableAt,
    payload: { campaignId },
    type: BUSINESS_EVENTS.pushCampaignRequested,
  });
}

export async function scheduleCartReminder(input: { sessionKey: string }) {
  return enqueueOutboxEvent({
    aggregateType: "Cart",
    idempotencyKey: `${BUSINESS_EVENTS.pushCartReminderDue}:${input.sessionKey}`,
    availableAt: new Date(Date.now() + 24 * 60 * 60_000),
    payload: { sessionKey: input.sessionKey },
    type: BUSINESS_EVENTS.pushCartReminderDue,
  });
}

export async function sendPushCampaign(campaignId: string) {
  const campaign = await db.pushCampaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) return { sent: 0, skipped: 1 };

  if (!isPushConfigured()) {
    await db.pushCampaign.update({
      where: { id: campaign.id },
      data: {
        lastError: "VAPID keys are not configured.",
        status: "FAILED",
      },
    });
    return { sent: 0, skipped: 1 };
  }

  const subscriptions = await db.pushSubscription.findMany({
    where: getCampaignSubscriptionWhere(campaign.segment),
    take: 500,
  });
  let sent = 0;

  for (const subscription of subscriptions) {
    const delivery = await db.pushDelivery.create({
      data: {
        campaignId: campaign.id,
        endpoint: subscription.endpoint,
        subscriptionId: subscription.id,
      },
    });
    const result = await sendPushToSubscription({
      auth: subscription.auth,
      body: campaign.body,
      deliveryId: delivery.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.p256dh,
      tag: `campaign:${campaign.id}`,
      title: campaign.title,
      url: campaign.targetUrl,
    });

    if (result.ok) sent += 1;
  }

  await db.pushCampaign.update({
    where: { id: campaign.id },
    data: {
      sentAt: new Date(),
      status: "SENT",
    },
  });

  return { sent, skipped: subscriptions.length - sent };
}

export async function sendCartReminder(sessionKey: string) {
  if (!isPushConfigured()) return { sent: 0, skipped: 1 };

  const cart = await db.cart.findFirst({
    where: { sessionKey, status: "ACTIVE" },
    include: {
      items: { take: 1 },
      orders: { take: 1 },
    },
  });

  if (!cart || cart.items.length === 0 || cart.orders.length > 0) {
    return { sent: 0, skipped: 1 };
  }

  const subscriptions = await db.pushSubscription.findMany({
    where: {
      marketingOptIn: true,
      sessionKey,
      status: "ACTIVE",
    },
  });
  let sent = 0;

  for (const subscription of subscriptions) {
    const result = await sendPushToSubscription({
      auth: subscription.auth,
      body: "הבחירה שלך עדיין ממתינה. אפשר לחזור אליה כשנוח לך.",
      endpoint: subscription.endpoint,
      p256dh: subscription.p256dh,
      tag: `cart:${cart.id}`,
      title: "הבחירה שלך ב-Elysia נשמרה",
      url: "/checkout",
    });

    if (result.ok) sent += 1;
  }

  return { sent, skipped: subscriptions.length - sent };
}

export async function processBackInStockInterests() {
  if (!isPushConfigured()) return { sent: 0, skipped: 0 };

  const interests = await db.productPushInterest.findMany({
    where: { kind: "BACK_IN_STOCK", status: "ACTIVE" },
    include: {
      product: {
        include: {
          variants: {
            include: {
              inventoryItems: true,
            },
          },
        },
      },
      subscription: true,
    },
    take: 50,
  });
  let sent = 0;
  let skipped = 0;

  for (const interest of interests) {
    const available = interest.product.variants.some((variant) =>
      variant.inventoryItems.some(
        (item) => item.quantity - item.reserved - item.safetyStock > 0,
      ),
    );

    if (!available || interest.subscription.status !== "ACTIVE") {
      skipped += 1;
      continue;
    }

    const result = await sendPushToSubscription({
      auth: interest.subscription.auth,
      body: `${interest.product.name} שוב פנוי לבחירה במבחר.`,
      endpoint: interest.subscription.endpoint,
      p256dh: interest.subscription.p256dh,
      tag: `back-in-stock:${interest.productId}`,
      title: "תכשיט שחיכית לו פנוי לבחירה",
      url: `/product/${interest.product.slug}`,
    });

    if (result.ok) {
      sent += 1;
      await db.productPushInterest.update({
        where: { id: interest.id },
        data: {
          notifiedAt: new Date(),
          status: "NOTIFIED",
        },
      });
    } else {
      skipped += 1;
    }
  }

  return { sent, skipped };
}

async function sendPushToSubscription(input: {
  auth: string;
  body: string;
  deliveryId?: string;
  endpoint: string;
  p256dh: string;
  tag?: string;
  title: string;
  url: string;
}) {
  configureWebPush();

  try {
    await webPush.sendNotification(
      {
        endpoint: input.endpoint,
        keys: {
          auth: input.auth,
          p256dh: input.p256dh,
        },
      },
      JSON.stringify(
        pushPayloadSchema.parse({
          body: input.body,
          tag: input.tag,
          title: input.title,
          url: assertInternalPushTargetUrl(input.url),
        }),
      ),
    );

    if (input.deliveryId) {
      await db.pushDelivery.update({
        where: { id: input.deliveryId },
        data: {
          deliveredAt: new Date(),
          status: "SENT",
        },
      });
    }

    return { ok: true };
  } catch (error) {
    const statusCode =
      typeof error === "object" && error && "statusCode" in error
        ? Number((error as { statusCode?: number }).statusCode)
        : undefined;
    const message = error instanceof Error ? error.message : "Push failed.";

    if (statusCode === 404 || statusCode === 410) {
      await db.pushSubscription.updateMany({
        where: { endpoint: input.endpoint },
        data: {
          marketingOptIn: false,
          revokedAt: new Date(),
          status: "REVOKED",
          transactionalOptIn: false,
        },
      });
    }

    if (input.deliveryId) {
      await db.pushDelivery.update({
        where: { id: input.deliveryId },
        data: {
          error: message,
          status: "FAILED",
        },
      });
    }

    return { error: message, ok: false };
  }
}

function configureWebPush() {
  if (vapidConfigured) return;

  const publicKey = getVapidPublicKey();
  const privateKey = env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys are not configured.");
  }

  webPush.setVapidDetails(
    env.VAPID_SUBJECT ?? `mailto:${env.OPERATIONS_EMAIL ?? "3twito@gmail.com"}`,
    publicKey,
    privateKey,
  );
  vapidConfigured = true;
}

function getCampaignSubscriptionWhere(segment: string) {
  if (segment === "TRANSACTIONAL_OPT_IN") {
    return { status: "ACTIVE", transactionalOptIn: true };
  }

  if (segment === "ALL_ACTIVE") {
    return { status: "ACTIVE" };
  }

  return { status: "ACTIVE", marketingOptIn: true };
}

export function assertInternalPushTargetUrl(value: string) {
  const baseUrl = env.SITE_URL ?? "https://elysia.co.il";

  try {
    return normalizeInternalPushTargetUrl(value, baseUrl);
  } catch {
    throw new Error("Push target URL is invalid.");
  }
}
