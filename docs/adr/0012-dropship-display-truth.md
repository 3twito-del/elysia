# Dropship display truth: scheduled sync as baseline, mandatory click-out verification as guarantee

Status: accepted (2026-07-08)

The supplier checkout is the money truth, but Elysia's display can still lie —
manual-only catalog sync meant unbounded price/availability drift between the
mirror and the supplier's Shopify checkout. "The checkout may be
supplier-owned, but the moment before handoff is Elysia-owned. That moment must
not lie."

## Decisions (all five accepted)

1. **Scheduled sync — freshness baseline.** Every 6 hours; freshness SLO:
   displayed capsule price/availability ≤ 12 hours old; violations raise
   OperationalAlerts. Sync records lastSyncedAt, supplier timestamps, status,
   errors; marks stale items; on severe uncertainty (API failure, missing
   variant, currency mismatch, deleted item) the capsule product moves to
   unavailable/blocked rather than pretending.
2. **Click-out verification — the guarantee, fail-closed.** Before every
   redirect to the supplier checkout: live variant-level verification of
   existence, `availableForSale`, current price, currencyCode = ILS, option
   match, and checkout-URL validity. Price drift → update display, show
   "המחיר עודכן על ידי הספק", require customer re-confirmation, record a drift
   event. Unavailable → block redirect with honest recovery (notify-me,
   similar items, support, remove, back to category). **Verification failure
   (API down, credentials, rate limit, ambiguous) blocks the redirect — failure
   to verify is not permission to proceed.**
3. **PDP availability honesty.** Supplier-unavailable capsule items stay
   reachable (shared/ad links) but show a truthful unavailable state with
   purchase controls disabled; structured data/SEO never claims false
   availability; category/search demote or filter per merchandising policy.
4. **Discount engine guard.** Elysia coupons, promotions, cart discounts,
   price rules, and Elysia-generated "sale" badges are structurally blocked
   from supplier-MOR items (`discountEligible: false`) — the display-side
   mirror of ADR 0009's ledger guard. Supplier promotions appear only as
   supplier-sourced prices (sync or live). "If the supplier checkout will not
   honor it, Elysia must not promise it."
5. **Currency invariant.** ILS end-to-end; non-ILS supplier items are blocked
   from the capsule, never converted or approximated. Multi-currency is a
   later project with its own pricing/FX/tax/refund review.

## Model implications

Mirror carries supplier identities (shop/product/variant/handle/checkout),
mirrored price/compare-at/availability, supplierLastSyncedAt,
lastLiveVerifiedAt, mirrorStatus (FRESH/STALE/UNAVAILABLE/BLOCKED/ERROR),
blockReason, priceSource (SUPPLIER_SYNC/SUPPLIER_LIVE), financialTreatment,
discountEligible. Drift events (PRICE_CHANGED, AVAILABILITY_CHANGED,
VARIANT_MISSING, CURRENCY_MISMATCH, LIVE_VERIFY_FAILED, SUPPLIER_API_ERROR)
are operational/catalog truth events, not GL events. Alert severity: capsule
checkout-blocking issues P0/P1; a capsule-visible stale price is never
dashboard-only.

## Launch acceptance criteria

Scheduled sync live; variant-level mapping for every capsule product;
mandatory live verification with drift re-confirmation and fail-closed
behavior; truthful unavailable PDPs; discount blocking on supplier-MOR items;
ILS-only enforcement; alerts for staleness/drift/failures; tests for drift,
unavailability, stale data, discount blocking, currency mismatch.
