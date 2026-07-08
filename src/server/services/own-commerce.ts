// ADR 0013 — Gate L2 (Own Commerce Activation) structural guard.
//
// Own commerce means Elysia is the merchant of record: it takes the
// customer's money, owes the legal sales document, posts GL revenue, and
// carries refund liability. Until the L2 checklist is complete this entire
// surface must refuse to operate — "L1 live" (referral storefront) must never
// smuggle in "allowed to take money".
//
// The guard is an environment switch, not an admin UI toggle, so it cannot be
// flipped casually from the console. Flipping it requires a deploy with
// documented L2 checklist proof (see docs/DECISIONS.md, ADR 0013).

import type { FinancialTreatment } from "@prisma/client";

import { env } from "~/env";

/** ADR 0013 §L2 — the checklist that must be proven before the flag flips. */
export const OWN_COMMERCE_L2_CHECKLIST = [
  "money-event transactional outbox with idempotent payment.captured consumer (ADR 0002)",
  "CardCom webhook-as-hint / API-as-truth verification + payment state machine (ADR 0006)",
  "legal sales document auto-issue with transactional numbering (ADR 0010)",
  "own-inventory reservation-expiry SLO and ledger truth",
  "own-commerce reconciliation: captures ↔ orders ↔ GL ↔ documents ↔ refunds ↔ settlements",
] as const;

export function isOwnCommerceFlagEnabled(value: string | undefined) {
  return value === "1" || value?.toLowerCase() === "true";
}

export function isOwnCommerceEnabled() {
  return isOwnCommerceFlagEnabled(env.OWN_COMMERCE_ENABLED);
}

export class OwnCommerceDisabledError extends Error {
  readonly context: string;

  constructor(context: string) {
    super(
      `Own commerce is disabled (OWN_COMMERCE_ENABLED is off): ${context}. ` +
        "Gate L2 is incomplete — see docs/DECISIONS.md (ADR 0013).",
    );
    this.name = "OwnCommerceDisabledError";
    this.context = context;
  }
}

/** Throws unless Gate L2 is open. Call at every own-commerce entry point. */
export function assertOwnCommerceEnabled(context: string) {
  if (!isOwnCommerceEnabled()) {
    throw new OwnCommerceDisabledError(context);
  }
}

/**
 * ADR 0013 — publication guard. OWN products must not become publicly
 * visible while own commerce is disabled: a visible own product implies a
 * purchasable own product. Returns the block reason, or null when allowed.
 */
export function ownProductPublicationBlockReason(input: {
  nextStatus: string;
  ownCommerceEnabled: boolean;
  source: string;
}) {
  if (input.nextStatus !== "ACTIVE") return null;
  if (input.source !== "OWN") return null;
  if (input.ownCommerceEnabled) return null;

  return "own_commerce_disabled" as const;
}

/**
 * ADR 0009 — ledger guard. Only an OWN_SALE order may ever post product-sale
 * revenue (or its refund reversal) to the GL. Returns the skip reason for
 * non-postable treatments, or null when posting is allowed.
 */
export function orderSalePostingBlockReason(
  financialTreatment: FinancialTreatment,
) {
  if (financialTreatment === "OWN_SALE") return null;

  return "not_own_sale_financial_treatment" as const;
}
