import { db } from "~/server/db";

/**
 * Packing slip (INV-007, pack step): a price-free document listing what to pack
 * and where to ship it, for an order being fulfilled. The document model is
 * built by a pure, unit-tested function.
 */

export type PackingSlipItem = { name: string; sku: string; quantity: number };

export type PackingSlipAddress = {
  recipient: string;
  phone: string | null;
  street: string | null;
  city: string | null;
  postalCode: string | null;
};

export type PackingSlipModel = {
  orderNumber: string;
  recipientName: string;
  address: PackingSlipAddress | null;
  items: PackingSlipItem[];
  lineCount: number;
  totalUnits: number;
  generatedAt: Date;
};

function readString(source: Record<string, unknown>, key: string): string | null {
  const value = source[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

/** Shapes an order into a packing-slip document model. Pure. */
export function buildPackingSlipModel(input: {
  orderNumber: string;
  recipientName: string;
  shippingAddress: unknown;
  items: Array<{ name: string; sku: string; quantity: number }>;
  generatedAt?: Date;
}): PackingSlipModel {
  let address: PackingSlipAddress | null = null;
  if (input.shippingAddress && typeof input.shippingAddress === "object") {
    const source = input.shippingAddress as Record<string, unknown>;
    address = {
      recipient: readString(source, "recipient") ?? input.recipientName,
      phone: readString(source, "phone"),
      street: readString(source, "street"),
      city: readString(source, "city"),
      postalCode: readString(source, "postalCode"),
    };
  }

  const items = input.items.map((item) => ({
    name: item.name,
    sku: item.sku,
    quantity: item.quantity,
  }));

  return {
    orderNumber: input.orderNumber,
    recipientName: input.recipientName,
    address,
    items,
    lineCount: items.length,
    totalUnits: items.reduce((sum, item) => sum + item.quantity, 0),
    generatedAt: input.generatedAt ?? new Date(),
  };
}

/** Loads an order and returns its packing-slip model (null if not found). */
export async function getPackingSlip(
  orderId: string,
): Promise<PackingSlipModel | null> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      orderNumber: true,
      recipientName: true,
      shippingAddress: true,
      items: { select: { name: true, sku: true, quantity: true } },
    },
  });
  if (!order) return null;

  return buildPackingSlipModel({
    orderNumber: order.orderNumber,
    recipientName: order.recipientName,
    shippingAddress: order.shippingAddress,
    items: order.items,
  });
}
