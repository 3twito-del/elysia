import { db } from "~/server/db";
import {
  getFixtureCatalogProductBySlug,
  shouldUseCatalogFixtures,
} from "~/server/services/catalog-fixtures";
import { recordAnalyticsEvent } from "~/server/services/analytics";

export async function recordProductClickEvent(input: {
  productSlug: string;
  query?: string;
  position?: number;
  sessionKey?: string;
}) {
  if (shouldUseCatalogFixtures()) {
    return Boolean(getFixtureCatalogProductBySlug(input.productSlug));
  }

  const product = await db.product.findUnique({
    where: { slug: input.productSlug },
    select: { id: true },
  });

  if (!product) return false;

  await db.productClickEvent.create({
    data: {
      productId: product.id,
      query: input.query,
      position: input.position,
      sessionKey: input.sessionKey,
    },
  });
  await recordProductAnalyticsSafely({
    type: "product_click",
    productId: product.id,
    sessionKey: input.sessionKey,
    consentMode: "measurement",
    payload: {
      query: input.query ?? null,
      position: input.position ?? null,
    },
  });

  return true;
}

export async function recordProductViewEvent(input: {
  productSlug: string;
  sessionKey?: string;
  customerId?: string;
  path?: string;
}) {
  if (shouldUseCatalogFixtures()) {
    return Boolean(getFixtureCatalogProductBySlug(input.productSlug));
  }

  const product = await db.product.findUnique({
    where: { slug: input.productSlug },
    select: { id: true },
  });

  if (!product) return false;

  await db.productViewEvent.create({
    data: {
      productId: product.id,
      sessionKey: input.sessionKey,
      customerId: input.customerId,
      path: input.path,
    },
  });
  await recordProductAnalyticsSafely({
    type: "product_view",
    productId: product.id,
    sessionKey: input.sessionKey,
    customerId: input.customerId,
    path: input.path,
    consentMode: "measurement",
  });

  return true;
}

async function recordProductAnalyticsSafely(
  input: Parameters<typeof recordAnalyticsEvent>[0],
) {
  try {
    await recordAnalyticsEvent(input);
  } catch (error) {
    console.error("[product-events:analytics-failed]", error);
  }
}
