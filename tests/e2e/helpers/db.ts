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
