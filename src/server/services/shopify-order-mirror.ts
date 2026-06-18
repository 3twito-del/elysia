import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { db } from "~/server/db";
import { redactWebhookPayload } from "~/server/services/webhook-events";

const shopifyOrderWebhookSchema = z
  .object({
    admin_graphql_api_id: z.string().optional().nullable(),
    contact_email: z.string().optional().nullable(),
    currency: z.string().optional().nullable(),
    current_total_price: z.string().optional().nullable(),
    customer: z
      .object({
        email: z.string().optional().nullable(),
      })
      .optional()
      .nullable(),
    email: z.string().optional().nullable(),
    financial_status: z.string().optional().nullable(),
    fulfillment_status: z.string().optional().nullable(),
    id: z.union([z.string(), z.number()]).optional().nullable(),
    line_items: z
      .array(z.record(z.string(), z.unknown()))
      .optional()
      .default([]),
    name: z.string().optional().nullable(),
    order_number: z.union([z.string(), z.number()]).optional().nullable(),
    total_price: z.string().optional().nullable(),
  })
  .passthrough();

export type ShopifyOrderMirrorResult = {
  customerEmail?: string;
  orderMirrorId: string;
  shopifyOrderId: string;
  shopifyOrderName?: string;
  total: string;
};

export async function mirrorShopifyOrderWebhook(
  payload: unknown,
): Promise<ShopifyOrderMirrorResult> {
  const order = shopifyOrderWebhookSchema.parse(payload);
  const shopifyOrderId = getShopifyOrderId(order);
  const shopifyOrderName =
    getOptionalString(order.name) ?? getOrderNumber(order);
  const customerEmail = normalizeEmail(
    getOptionalString(order.email) ??
      getOptionalString(order.contact_email) ??
      getOptionalString(order.customer?.email),
  );
  const total = normalizeMoney(
    order.current_total_price ?? order.total_price ?? "0",
  );
  const currency = getOptionalString(order.currency) ?? "ILS";
  const lineItems = order.line_items;
  const supplierKey = getSupplierKey(lineItems);

  const mirror = await db.shopifyOrderMirror.upsert({
    where: { shopifyOrderId },
    update: {
      currency,
      customerEmail,
      financialStatus: getOptionalString(order.financial_status),
      fulfillmentStatus: getOptionalString(order.fulfillment_status),
      lineItems: lineItems as Prisma.InputJsonValue,
      processedAt: new Date(),
      rawPayload: redactWebhookPayload(payload) as Prisma.InputJsonValue,
      shopifyOrderName,
      supplierKey,
      total,
    },
    create: {
      currency,
      customerEmail,
      financialStatus: getOptionalString(order.financial_status),
      fulfillmentStatus: getOptionalString(order.fulfillment_status),
      lineItems: lineItems as Prisma.InputJsonValue,
      processedAt: new Date(),
      rawPayload: redactWebhookPayload(payload) as Prisma.InputJsonValue,
      shopifyOrderId,
      shopifyOrderName,
      supplierKey,
      total,
    },
  });

  return {
    customerEmail: mirror.customerEmail ?? undefined,
    orderMirrorId: mirror.id,
    shopifyOrderId: mirror.shopifyOrderId,
    shopifyOrderName: mirror.shopifyOrderName ?? undefined,
    total: mirror.total.toString(),
  };
}

function getShopifyOrderId(
  order: z.infer<typeof shopifyOrderWebhookSchema>,
): string {
  const id =
    getOptionalString(order.admin_graphql_api_id) ??
    getOptionalString(order.id);

  if (!id) {
    throw new Error("Shopify order webhook is missing an order id.");
  }

  return id;
}

function getOrderNumber(order: z.infer<typeof shopifyOrderWebhookSchema>) {
  return getOptionalString(order.order_number);
}

function normalizeMoney(value: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return "0.00";

  return parsed.toFixed(2);
}

function getSupplierKey(lineItems: Array<Record<string, unknown>>) {
  const supplierKeys = new Set<string>();

  for (const item of lineItems) {
    const value =
      getOptionalString(item.vendor) ??
      getOptionalString(item.supplier_key) ??
      getOptionalString(item.supplierKey);

    if (value) supplierKeys.add(value);
  }

  if (supplierKeys.size === 1) return [...supplierKeys][0];

  return undefined;
}

function getOptionalString(value: unknown) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);

  return undefined;
}

function normalizeEmail(value: string | undefined) {
  return value?.trim().toLowerCase();
}
