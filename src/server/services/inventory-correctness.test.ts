import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * K-05 inventory-correctness guards.
 *
 * These are source-shape assertions, not runtime concurrency tests: this repo
 * has no test-database wiring for Vitest, so the real oversell/expiry races can
 * only be exercised against a live Postgres (see docs/QA_EVIDENCE.md ->
 * k-05-inventory-correctness for the reasoning proof and the residual e2e
 * MEASURE follow-up). What these lock down is the *structural* invariant that
 * every stock-mutating path keeps its compare-and-swap guard and its
 * append-only ledger discipline, so a future refactor cannot silently drop the
 * concurrency protection or resurrect the array form of db.$transaction (which
 * throws at runtime against this repo's retry-proxy db client).
 */

function read(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function sliceFn(source: string, signature: string) {
  const start = source.indexOf(signature);

  expect(start, `expected to find "${signature}"`).toBeGreaterThanOrEqual(0);

  const rest = source.slice(start + signature.length);
  const boundary = rest.search(/\n(?:export )?(?:async )?function /);

  return rest.slice(0, boundary === -1 ? rest.length : boundary);
}

describe("checkout reservation compare-and-swap (oversell guard)", () => {
  it("cart checkout reserves via a conditional updateMany and rejects lost races", () => {
    const source = read("src/server/services/cart-checkout.ts");
    const fn = sliceFn(source, "async function createCartCheckoutOrderInTransaction");

    // The oversell guard: increment `reserved` only while it still sits at or
    // below the sellable headroom, then require exactly one affected row.
    expect(fn).toContain("tx.inventoryItem.updateMany");
    expect(fn).toContain("reserved: {");
    expect(fn).toContain("lte:");
    expect(fn).toContain("reserved.count !== 1");
    expect(fn).toContain('code: "CONFLICT"');
    // Reservation + append-only ledger row are written in the same transaction.
    expect(fn).toContain("tx.inventoryReservation.create");
    expect(fn).toContain("tx.inventoryLedger.create");
    expect(fn).toContain('reason: "cart_checkout_reserved"');

    // Callback-form transaction only — the array form throws against the
    // retry-proxy db client used across this repo.
    expect(source).toContain("db.$transaction((tx) =>");
    expect(source).not.toContain("db.$transaction([");
  });

  it("cart checkout only ever reserves OWN (non-dropship) items", () => {
    const source = read("src/server/services/cart-checkout.ts");

    // Local ledger/reservation writes are reachable only for the OWN subset.
    expect(source).toContain("getCartCheckoutOwnItems(cart.items)");
    expect(source).toContain('item.variant.product.source === "OWN"');
  });

  it("manual order reserves via the same conditional updateMany guard", () => {
    const source = read("src/server/services/manual-order.ts");
    const fn = sliceFn(source, "async function createManualOrderInTransaction");

    expect(fn).toContain("tx.inventoryItem.updateMany");
    expect(fn).toContain("reserved.count !== 1");
    expect(fn).toContain("lte:");
    expect(fn).toContain('reason: "manual_order_reserved"');
  });

  it("POS sale deducts on-hand stock with a conditional updateMany guard", () => {
    const source = read("src/server/services/pos-register.ts");

    // Immediate handover: decrement `quantity` only while enough remains after
    // outstanding reservations, then require exactly one affected row.
    expect(source).toContain("quantity: { gte: inventoryItem.reserved + quantity }");
    expect(source).toContain("deducted.count !== 1");
    expect(source).toContain('reason: "pos_sale"');
  });
});

describe("reservation expiry vs. payment capture race guard", () => {
  it("expiry claims the PENDING_PAYMENT -> CANCELLED transition before releasing stock", () => {
    const source = read("src/server/services/jobs.ts");
    const fn = sliceFn(source, "async function processReservationExpiryEvent");

    // Callback-form transaction.
    expect(source).toContain("db.$transaction(async (tx)");
    expect(source).not.toContain("db.$transaction([");

    // The cancellation is a status compare-and-swap that gates the reservation
    // release, so a concurrently-paid order never has its stock released.
    expect(fn).toContain('status: "PENDING_PAYMENT"');
    expect(fn).toContain("tx.order.updateMany");
    expect(fn).toContain("cancelled.count !== 1");
    // The release itself is guarded and append-only (immutable ledger).
    expect(fn).toContain("reserved: { decrement: reservation.quantity }");
    expect(fn).toContain("tx.inventoryLedger.create");
    expect(fn).toContain('reason: "reservation_expired"');

    // The old unconditional order.update MUST NOT come back: it was the bug.
    expect(source).not.toContain("tx.order.update(");
  });

  it("payment capture marks PAID via a status compare-and-swap, not a blind write", () => {
    const source = read("src/server/services/payment-webhooks.ts");
    const fn = sliceFn(source, "export async function applyCardComWebhook");

    expect(source).toContain("db.$transaction(async (tx)");
    expect(source).not.toContain("db.$transaction([");

    // Only flip PENDING_PAYMENT -> PAID; a concurrently-cancelled order stays
    // cancelled (its reservation is already released — resurrecting it to PAID
    // would oversell).
    expect(fn).toContain("tx.order.updateMany");
    expect(fn).toContain('status: "PENDING_PAYMENT"');
    expect(fn).toContain('status: "PAID"');
    expect(source).not.toContain("tx.order.update(");
  });

  it("skips the GL/loyalty pipeline when the order lost the race to a cancellation", () => {
    const source = read("src/server/services/payment-webhooks.ts");
    const fn = sliceFn(source, "export async function applyCardComWebhook");

    // The outbox capturedEvent (and therefore the GL/loyalty fast path, which
    // is gated on it existing) is only created when the order actually ended
    // up PAID -- never for a payment captured after a concurrent cancellation
    // already released the reservation.
    expect(fn).toContain('captured && finalOrderStatus === "PAID"');
    expect(fn).toContain("captured-after-order-not-paid");
  });
});

describe("Shopify dropship never enters the local ownership ledger", () => {
  it("the dropship sync writes no InventoryItem / InventoryLedger / reserved rows", () => {
    const source = read("src/server/services/shopify-dropship-sync.ts");

    expect(source).not.toMatch(/[iI]nventoryItem/);
    expect(source).not.toMatch(/[iI]nventoryLedger/);
    expect(source).not.toMatch(/\breserved\b/);
  });

  it("the dropship click-out checkout writes no local stock rows", () => {
    const source = read("src/server/services/shopify-dropship-checkout.ts");

    expect(source).not.toMatch(/[iI]nventoryItem/);
    expect(source).not.toMatch(/[iI]nventoryLedger/);
    // It only filters TO the dropship subset and hands off to the supplier.
    expect(source).toContain('product.source === "DROPSHIP_SHOPIFY"');
  });

  it("admin inventory edits are refused for dropship-sourced variants", () => {
    const source = read("src/server/services/admin-commerce.ts");
    const fn = sliceFn(source, "export async function updateAdminInventory");

    expect(fn).toContain('variant.product.source !== "OWN"');
  });
});
