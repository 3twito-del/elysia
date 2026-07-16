import { randomUUID } from "node:crypto";

import { PrismaClient, type ProductStatus } from "@prisma/client";

// K-01: role-scoped E2E needs to assert audit-log side effects, not just UI
// state. A single lazily-created client for the whole e2e run — this is
// test-only code, never bundled into the app.
let client: PrismaClient | null = null;

export function getTestDb() {
  client ??= new PrismaClient();

  return client;
}

/**
 * A throwaway product+variant for e2e tests that need to mutate real catalog/
 * inventory state (K-01: catalog status, inventory adjustment) without
 * touching seeded products other specs already depend on.
 */
export async function createDisposableAdminProduct(options: {
  status: ProductStatus;
  withInventory?: boolean;
}) {
  const db = getTestDb();
  const suffix = randomUUID().slice(0, 8);
  const [category, material] = await Promise.all([
    db.category.findFirstOrThrow(),
    db.material.findFirstOrThrow(),
  ]);

  const product = await db.product.create({
    data: {
      slug: `e2e-disposable-${suffix}`,
      sku: `E2E-DISPOSABLE-${suffix}`,
      name: `E2E Disposable Product ${suffix}`,
      shortDescription: "E2E disposable fixture product.",
      description:
        "E2E disposable fixture product, created and deleted per test run.",
      status: options.status,
      source: "OWN",
      categoryId: category.id,
      materialId: material.id,
      basePrice: 100,
    },
  });
  const variant = await db.productVariant.create({
    data: {
      productId: product.id,
      sku: `E2E-DISPOSABLE-VARIANT-${suffix}`,
      name: "ברירת מחדל",
      isDefault: true,
    },
  });
  let branchId: string | undefined;

  if (options.withInventory) {
    const branch = await db.branch.findFirstOrThrow({
      where: { kind: "ONLINE", isActive: true },
    });

    await db.inventoryItem.create({
      data: {
        branchId: branch.id,
        variantId: variant.id,
        quantity: 10,
        safetyStock: 0,
      },
    });
    branchId = branch.id;
  }

  return {
    branchId,
    productId: product.id,
    productSku: product.sku,
    productSlug: product.slug,
    variantId: variant.id,
    variantSku: variant.sku,
  };
}

/**
 * Deletes a disposable product created by `createDisposableAdminProduct`,
 * cascading its variant/inventory/ledger rows. `InventoryLedger` is
 * append-only at the database level (ADR 0004); this uses the same
 * transaction-scoped escape hatch `prisma/seed.ts` uses for maintenance —
 * see `prisma/migrations/20260708140000_immutability_triggers/migration.sql`.
 */
export async function deleteDisposableAdminProduct(productId: string) {
  const db = getTestDb();

  await db.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      "SET LOCAL elysia.allow_protected_mutation = 'on'",
    );
    await tx.product.delete({ where: { id: productId } });
  });
}

/**
 * A throwaway two-item OWN_SALE order for e2e tests that need to exercise
 * partial/line-level refund (OMS-006) through the real admin UI — the
 * shared customer-auth-fixture order (customer-auth-fixtures.ts) is
 * deliberately a single item at quantity 1, which can't express a partial
 * refund at all.
 */
export async function createDisposableAdminOrder() {
  const db = getTestDb();
  const suffix = randomUUID().slice(0, 8);
  const [category, material, branch] = await Promise.all([
    db.category.findFirstOrThrow(),
    db.material.findFirstOrThrow(),
    db.branch.findFirstOrThrow({ where: { kind: "ONLINE", isActive: true } }),
  ]);

  async function createVariant(price: number) {
    const product = await db.product.create({
      data: {
        slug: `e2e-disposable-order-${suffix}-${price}`,
        sku: `E2E-DISPOSABLE-ORDER-${suffix}-${price}`,
        name: `E2E Disposable Order Item ${suffix} ${price}`,
        shortDescription: "E2E disposable order-fixture product.",
        description:
          "E2E disposable order-fixture product, created and deleted per test run.",
        status: "ACTIVE",
        source: "OWN",
        categoryId: category.id,
        materialId: material.id,
        basePrice: price,
      },
    });
    const variant = await db.productVariant.create({
      data: {
        productId: product.id,
        sku: `E2E-DISPOSABLE-ORDER-VARIANT-${suffix}-${price}`,
        name: "ברירת מחדל",
        isDefault: true,
      },
    });
    return { productId: product.id, variantId: variant.id };
  }

  const itemA = await createVariant(100);
  const itemB = await createVariant(50);

  const order = await db.order.create({
    data: {
      orderNumber: `E2E-DISPOSABLE-ORDER-${suffix}`,
      branchId: branch.id,
      status: "COMPLETED",
      financialTreatment: "OWN_SALE",
      subtotal: 250,
      total: 250,
      email: "e2e-disposable-order@example.com",
      phone: "0500000000",
      recipientName: "E2E Disposable Order",
      completedAt: new Date(),
      items: {
        create: [
          {
            variantId: itemA.variantId,
            name: "פריט A",
            sku: "E2E-DISPOSABLE-A",
            quantity: 2,
            unitPrice: 100,
          },
          {
            variantId: itemB.variantId,
            name: "פריט B",
            sku: "E2E-DISPOSABLE-B",
            quantity: 1,
            unitPrice: 50,
          },
        ],
      },
      payments: {
        create: [
          {
            provider: "fixture",
            status: "CAPTURED",
            amount: 250,
            idempotencyKey: `e2e-disposable-order-payment-${suffix}`,
            capturedAt: new Date(),
          },
        ],
      },
    },
    include: { items: true, payments: true },
  });

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    itemAId: order.items.find((item) => item.variantId === itemA.variantId)!
      .id,
    itemBId: order.items.find((item) => item.variantId === itemB.variantId)!
      .id,
    productIds: [itemA.productId, itemB.productId],
  };
}

/** Deletes a disposable order created by `createDisposableAdminOrder`. */
export async function deleteDisposableAdminOrder(input: {
  orderId: string;
  orderNumber: string;
  productIds: string[];
}) {
  const db = getTestDb();

  await db.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      "SET LOCAL elysia.allow_protected_mutation = 'on'",
    );
    await tx.journalLine.deleteMany({
      where: { journalEntry: { orderId: input.orderId } },
    });
    await tx.journalEntry.deleteMany({ where: { orderId: input.orderId } });
    await tx.returnRequestLine.deleteMany({
      where: { returnRequest: { orderId: input.orderId } },
    });
    await tx.returnRequest.deleteMany({ where: { orderId: input.orderId } });
    await tx.inventoryLedger.deleteMany({
      where: { reference: input.orderNumber },
    });
    await tx.auditLog.deleteMany({
      where: { entity: "Order", entityId: input.orderId },
    });
    await tx.outboxEvent.deleteMany({
      where: { aggregateType: "Order", aggregateId: input.orderId },
    });
    await tx.order.delete({ where: { id: input.orderId } });
    for (const productId of input.productIds) {
      await tx.product.delete({ where: { id: productId } });
    }
  });
}
