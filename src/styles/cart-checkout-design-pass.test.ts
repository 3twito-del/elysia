import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

const checkoutForm = read(
  "src/app/checkout/_components/cart-checkout-form.tsx",
);
const checkoutStatus = read("src/app/checkout/_components/checkout-status.tsx");
const checkoutStepBadge = read(
  "src/app/checkout/_components/checkout-step-badge.tsx",
);

describe("cart + checkout design pass (owner-selected DP 41-50)", () => {
  it("aligns the per-item price to a consistent edge, matching the summary's label/value pattern", () => {
    expect(checkoutForm).toContain(
      'className="text-foreground mt-1 flex items-baseline justify-between gap-2 text-sm font-semibold"',
    );
    expect(checkoutForm).toContain("<span>סה״כ</span>");
    expect(checkoutForm).toContain('data-testid="checkout-line-total-amount"');
  });

  it("keeps clear disabled bounds on quantity steppers (audit: already correct, and pinned by an existing test)", () => {
    expect(checkoutForm).toContain("item.quantity <= 1");
    expect(checkoutForm).toContain("item.quantity >= 10");
  });

  it("keeps a single emphasized total in the order summary (audit: already correct)", () => {
    expect(checkoutForm).toContain(
      '<div className="flex justify-between text-base font-semibold">',
    );
  });

  it("gives field errors an icon alongside the accessible destructive color", () => {
    expect(checkoutStatus).toContain(
      '<AlertCircle aria-hidden="true" className="size-3.5 shrink-0" />',
    );
    expect(checkoutStatus).toContain('className="text-destructive flex min-h-5 items-center gap-1 text-xs leading-5"');
  });

  it("keeps the source-group cards uniform and shared (audit: already data-driven from one array)", () => {
    expect(checkoutForm).toContain('data-testid="checkout-source-groups"');
    expect(checkoutForm).toContain("checkoutDisplayGroups.map((group)");
  });

  it("gives the top step-overview panel a subtle completed state with a token-based color, without touching the standalone per-section step badges", () => {
    const css = read("src/styles/globals.css");

    expect(checkoutStepBadge).toContain("isComplete = false");
    expect(checkoutStepBadge).toContain("data-checkout-step-complete");
    expect(checkoutStepBadge).toContain("checkout-step-badge-complete");
    expect(checkoutStepBadge).not.toMatch(/emerald/);
    expect(css).toContain(
      ".checkout-step-badge-complete {\n  border-color: var(--elysia-success);",
    );
    expect(checkoutForm).toContain("checkoutStepCompletionByValue[step.value]");
    // The four standalone section-header badges stay untouched (pinned by
    // visible-site-improvements.test.ts as literal self-closing tags).
    expect(checkoutForm).toContain('<CheckoutStepBadge value="1" />');
    expect(checkoutForm).toContain('<CheckoutStepBadge value="2" />');
    expect(checkoutForm).toContain('<CheckoutStepBadge value="3" />');
    expect(checkoutForm).toContain('<CheckoutStepBadge value="4" />');
  });

  it("trims the empty-cart explanation while keeping the two recovery CTAs required by the empty-state guardrail", () => {
    expect(checkoutForm).not.toContain(
      "אחרי הוספה לסל תראי כאן מוצר, כמות,",
    );
    expect(checkoutForm).toContain("שלושה תכשיטים שנבחרים שוב ושוב.");
    expect(checkoutForm).toContain('href="/search"');
    expect(checkoutForm).toContain('href="/gifts"');
  });

  it("gives the payment button an internal spinner while submitting, without changing its width (already w-full)", () => {
    expect(checkoutForm).toContain(
      'createOrder.isPending ? "שולחים הזמנה" : localCheckoutButtonLabel',
    );
    expect(checkoutForm).toContain(
      '<Spinner aria-hidden="true" role="presentation" />',
    );
    expect(checkoutForm).toContain('className="mt-3 w-full"');
  });

  it("reduces the mobile sticky summary to item count and total only", () => {
    expect(checkoutForm).not.toContain("פרטים חסרים");
    expect(checkoutForm).not.toContain("נדרשת בדיקת מחיר");
    expect(checkoutForm).toContain("mobileCheckoutSummaryCopy");
    expect(checkoutForm).toContain(
      'data-testid="mobile-checkout-source-context"',
    );
    const sourceContextIndex = checkoutForm.indexOf(
      'data-testid="mobile-checkout-source-context"',
    );
    const totalIndex = checkoutForm.indexOf(
      '<p className="text-lg font-semibold">{orderTotalLabel}</p>',
    );
    expect(sourceContextIndex).toBeGreaterThan(-1);
    expect(totalIndex).toBeGreaterThan(-1);
    expect(sourceContextIndex).toBeLessThan(totalIndex);
  });
});
