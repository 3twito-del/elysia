// K-06 residual: webhook-registration and token-scope drift detection. The
// fail-closed click-out verification, price-drift re-confirmation, and the
// scheduled catalog sync (ADR 0012) already guard product-level truth; this
// closes the remaining gap -- confirming Shopify still has the webhook
// subscriptions and token scopes this integration depends on, so a merchant
// revoking a scope or an app reinstall silently dropping a webhook shows up
// as an alert instead of a silent mirror gap.

import { env } from "~/env";
import { shopifyDropshipProvider } from "~/server/adapters/shopify";

/**
 * `/api/webhooks/shopify/orders` (mirrorShopifyOrderWebhook) is topic-agnostic
 * -- it upserts ShopifyOrderMirror by shopifyOrderId regardless of which
 * topic fired. All three must still be registered for the mirror to stay
 * complete: `orders/create` for new orders, `orders/updated` for status
 * changes, `orders/cancelled` for cancellations (Shopify does not always
 * also emit `orders/updated` for a cancellation).
 */
export const EXPECTED_SHOPIFY_ORDER_WEBHOOK_TOPICS = [
  "orders/create",
  "orders/updated",
  "orders/cancelled",
] as const;

/**
 * `read_products`: src/server/adapters/shopify.ts's admin GraphQL `products`
 * query (dropship catalog sync). `read_orders`: Shopify requires this scope
 * on the app's access token before it will deliver `orders/*` webhook topics
 * to any registered endpoint at all.
 */
export const REQUIRED_SHOPIFY_ACCESS_SCOPES = [
  "read_products",
  "read_orders",
] as const;

export type ShopifyWebhookDriftStatus = "ok" | "missing" | "address-mismatch";

export type ShopifyWebhookDrift = {
  topic: string;
  status: ShopifyWebhookDriftStatus;
  registeredAddress?: string;
};

export type ShopifyIntegrationDriftReport = {
  checkedAt: string;
  webhooks: ShopifyWebhookDrift[];
  missingScopes: string[];
  grantedScopeCount: number;
  ok: boolean;
};

/** Pure: compares already-fetched Shopify state against what this app expects. */
export function evaluateShopifyIntegrationDrift(input: {
  registeredWebhooks: ShopifyRegisteredWebhookLike[];
  grantedScopes: string[];
  expectedWebhookAddress: string;
  now?: Date;
}): ShopifyIntegrationDriftReport {
  const registeredByTopic = new Map(
    input.registeredWebhooks.map((webhook) => [webhook.topic, webhook.address]),
  );

  const webhooks: ShopifyWebhookDrift[] = EXPECTED_SHOPIFY_ORDER_WEBHOOK_TOPICS.map(
    (topic) => {
      const registeredAddress = registeredByTopic.get(topic);

      if (!registeredAddress) {
        return { status: "missing", topic };
      }

      if (registeredAddress !== input.expectedWebhookAddress) {
        return { registeredAddress, status: "address-mismatch", topic };
      }

      return { registeredAddress, status: "ok", topic };
    },
  );

  const grantedScopes = new Set(input.grantedScopes);
  const missingScopes = REQUIRED_SHOPIFY_ACCESS_SCOPES.filter(
    (scope) => !grantedScopes.has(scope),
  );

  return {
    checkedAt: (input.now ?? new Date()).toISOString(),
    grantedScopeCount: grantedScopes.size,
    missingScopes,
    ok:
      webhooks.every((webhook) => webhook.status === "ok") &&
      missingScopes.length === 0,
    webhooks,
  };
}

type ShopifyRegisteredWebhookLike = { topic: string; address: string };

export function getExpectedShopifyOrderWebhookAddress() {
  return `${env.SITE_URL ?? "https://elysia-jewellery.com"}/api/webhooks/shopify/orders`;
}

/**
 * `null` when Shopify dropshipping isn't enabled/configured -- there is
 * nothing to drift-check yet, matching the rest of this integration's
 * graceful-degradation convention.
 */
export async function checkShopifyIntegrationDrift(input?: {
  expectedWebhookAddress?: string;
  now?: Date;
}): Promise<ShopifyIntegrationDriftReport | null> {
  if (
    !shopifyDropshipProvider.isEnabled() ||
    !shopifyDropshipProvider.isConfigured()
  ) {
    return null;
  }

  const [registeredWebhooks, grantedScopes] = await Promise.all([
    shopifyDropshipProvider.listWebhookSubscriptions(),
    shopifyDropshipProvider.getGrantedAccessScopes(),
  ]);

  return evaluateShopifyIntegrationDrift({
    expectedWebhookAddress:
      input?.expectedWebhookAddress ?? getExpectedShopifyOrderWebhookAddress(),
    grantedScopes: grantedScopes ?? [],
    now: input?.now,
    registeredWebhooks: registeredWebhooks ?? [],
  });
}
