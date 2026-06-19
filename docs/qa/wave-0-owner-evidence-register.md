# Wave 0 Owner Evidence Register

Status: owner-assignment register, not completion evidence.

Last updated: 2026-06-19.

This register covers the Wave 0 owner-gated blockers named in
`docs/TIFFANY_SURPASS_MASTER_PLAN.md` immediate action 6:

- G-01 real Shopify supplier proof.
- G-02 paid Shopify checkout proof.
- G-03 supplier fulfillment proof.
- G-04 CardCom own-product payment proof.
- J-08 legal identity and policy review.

Do not replace `UNASSIGNED` with a person, date, or approval unless the owner
has explicitly accepted the responsibility and evidence target. Engineering can
prepare checks and runbooks, but these items require operations, supplier,
payment, and legal facts that are not present in the repository.

## Assignment Rules

Every P0 owner-gated item needs all of the following before it can leave
`OWNER` or `EXTERNAL` status:

- Directly responsible owner.
- Acceptance owner.
- Target evidence date.
- Evidence location.
- Rollback or containment owner.
- Residual-risk note.

The owner and acceptance owner should not be the same person unless the founder
explicitly accepts that concentration of responsibility.

## Current Register

| Item                                   | Required owner role                    | Direct owner | Acceptance owner | Target evidence date | Evidence location                                                                                         | Current status | Next owner action                                                                                                                       |
| -------------------------------------- | -------------------------------------- | ------------ | ---------------- | -------------------- | --------------------------------------------------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| G-01 real Shopify supplier proof       | Operations plus merchandising          | UNASSIGNED   | UNASSIGNED       | UNASSIGNED           | Outside-repo supplier/Shopify evidence, with redacted summary in this register                            | BLOCKED        | Confirm the real supplier channel, inventory source, SKUs, cancellation path, fulfillment behavior, and support escalation.             |
| G-02 paid Shopify checkout proof       | Operations plus commerce/payment owner | UNASSIGNED   | UNASSIGNED       | UNASSIGNED           | Shopify order evidence, Elysia webhook/account/admin observation, and redacted release note               | BLOCKED        | Approve a low-value paid checkout canary, test identity, cleanup rule, refund/void handling, and analytics exclusion.                   |
| G-03 supplier fulfillment proof        | Operations plus customer-service owner | UNASSIGNED   | UNASSIGNED       | UNASSIGNED           | Supplier order receipt, fulfillment/tracking proof, failure/cancel proof, and redacted support runbook    | BLOCKED        | Run a supplier-confirmed fulfillment path from Shopify order receipt through shipment/tracking and escalation.                          |
| G-04 CardCom own-product payment proof | Finance/payment owner plus operations  | UNASSIGNED   | UNASSIGNED       | UNASSIGNED           | Provider credential confirmation, payment/decline/cancel/webhook/refund evidence, and reconciliation note | BLOCKED        | Provide production-safe CardCom credentials and approve payment canary scope for own-product checkout.                                  |
| J-08 legal identity and policy review  | Legal/privacy plus founder/brand       | UNASSIGNED   | UNASSIGNED       | UNASSIGNED           | Counsel-approved policy package, version/effective dates, and public-field approval record                | BLOCKED        | Approve legal entity details, registration number, policy versions, supplier-order terms, data retention, and footer/checkout exposure. |

## Evidence Requirements

### G-01 Real Shopify Supplier Proof

Required evidence:

- Supplier app/channel name and connection path.
- Real supplier product IDs, variant IDs, handles, SKUs, and inventory behavior.
- Price ownership and currency behavior.
- Cancellation or unavailable-product path.
- Supplier support escalation contact or process.
- Confirmation that seeded validation products are not being mistaken for live
  supplier proof.

Repository-safe summary:

- Record only redacted identifiers, command names, and pass/fail results.
- Do not commit supplier contracts, private dashboard screenshots, tokens, or
  customer data.

### G-02 Paid Shopify Checkout Proof

Required evidence:

- Approved low-value paid test order or provider-approved test mode path.
- Shopify checkout completion.
- Shopify order creation.
- Webhook mirror received once.
- Elysia account and admin order states are accurate.
- Refund, void, or cleanup instruction.
- Analytics and reporting contamination handling.

Repository-safe summary:

- Record order status and redacted order reference only.
- Do not commit payment details, full customer identity, or provider secrets.

### G-03 Supplier Fulfillment Proof

Required evidence:

- Supplier receives the Shopify-created order.
- Supplier accepts or rejects through the normal workflow.
- Shipment/tracking update path is observed.
- Failure, cancellation, or out-of-stock path is documented.
- Customer-service escalation and ownership are defined.

Repository-safe summary:

- Record fulfillment status transitions and redacted references.
- Keep supplier dashboard screenshots and customer data outside the repository.

### G-04 CardCom Own-Product Payment Proof

Required evidence:

- Production and preview credential ownership.
- Successful payment path.
- Decline path.
- Cancel or abandoned payment path.
- Timeout or provider error recovery.
- Duplicate webhook handling.
- Refund/cancel policy and reconciliation owner.

Repository-safe summary:

- Record command names, route states, and redacted transaction references.
- Do not commit terminal IDs, API names, API passwords, or payment payloads.

### J-08 Legal Identity And Policy Review

Required evidence:

- Legal entity name.
- Registration number.
- Address and customer contact details approved for public display.
- Terms, privacy, cookies, accessibility, shipping, returns, warranty, supplier
  orders, personalized goods, promotions, and data-retention review.
- Version and effective date for every public policy.
- Approval of which legal facts are exposed in footer, checkout, emails, and
  account surfaces.

Repository-safe summary:

- Commit only approved public legal text and a redacted approval record.
- Do not commit private counsel notes or internal identity documents.

## Exit Criteria

This register is complete only when every row has:

- A named direct owner.
- A named acceptance owner.
- A target evidence date.
- A repository-safe evidence summary.
- A residual-risk note.

Until then, Wave 0 remains blocked on owner/external proof even if all
repository tests pass.
