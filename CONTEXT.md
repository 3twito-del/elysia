# Elysia

Hebrew-first (RTL) luxury-jewelry commerce platform plus a single-tenant internal
ERP/CRM suite, run as one system with one PostgreSQL source of truth. Currently
pre-revenue: no live payment processing and no real products yet.

## Language

### Commerce

**Own product**:
A product Elysia stocks, prices, and fulfills itself (`ProductSource.OWN`); its
future payment path is CardCom.
_Avoid_: house product, internal product

**Dropship product**:
A product mirrored from the supplier's Shopify store and fulfilled by the
supplier (`ProductSource.DROPSHIP_SHOPIFY`); paid in a separate Shopify
checkout where, by default, the **supplier — not Elysia — is the merchant of
record**. Elysia's role is referral/agency intake unless proven otherwise.
_Avoid_: supplier product, external product

**Click-out verification**:
The mandatory, fail-closed live check of a dropship item's price, availability,
and currency against the supplier's store at the moment before redirecting the
customer to the supplier checkout. Failure to verify blocks the redirect.
_Avoid_: price check, pre-redirect validation

**Merchant of record**:
The legal entity that takes the customer's money as seller — and therefore owes
the invoice, the refund, and the consumer-law relationship. Determines whether
an order may ever post revenue to Elysia's ledger.
_Avoid_: vendor, seller (unqualified)

**Financial treatment**:
An order's classification deciding its accounting path (own sale / agency
dropship / supplier-MOR reference / commission-only / unknown-blocked). Only an
own sale may post product-sale revenue.
_Avoid_: order type, source (when meaning accounting path)

**Split checkout**:
One cart that resolves into up to two payment paths — CardCom for own products,
a Shopify checkout for dropship products.
_Avoid_: mixed checkout, dual cart

**Publish-ready product**:
A product that passes the catalog readiness audit — verified facts, media, and
policy ownership — and may appear on the public storefront.
_Avoid_: complete product, live product

**Launch capsule**:
The named, curated set of individually publish-ready products (floor 30,
target 36, category-balanced) that constitutes the entire public catalog at
launch. Everything outside it is unpublished — not searchable, not indexed.
_Avoid_: launch catalog subset, MVP catalog

**Media-rights status**:
A product image's licensing state (owned / supplier-licensed /
manufacturer-licensed / stock-with-proof / unknown-blocked). Unknown means the
product page may not exist.
_Avoid_: image source, photo credit

### Money & events

**Money event**:
An externally confirmed movement of money (capture, refund, chargeback,
settlement) that must acquire a durable, reconcilable accounting representation
in the same transaction that admits it into business state.
_Avoid_: payment side effect, financial callback

**Outbox event**:
The durable obligation to process a business event, committed atomically with
the state change that caused it. The outbox is the guarantee; any inline
handling is only an accelerator.
_Avoid_: job, task, notification

**Webhook hint**:
An inbound provider callback treated as an untrusted wake-up signal. It may
trigger verification; it may never, by itself, change money or order state.
_Avoid_: webhook event, provider event

**Provider truth**:
The payment provider's authoritative answer, fetched server-to-server with our
credentials, matched against the local expectation before any money state
commits.
_Avoid_: webhook payload, callback data

**Legal sales document**:
The numbered, immutable statutory record of a sale (e.g. חשבונית מס-קבלה),
issued automatically when an own sale's payment is verified. Correction is an
append-only credit note, never an edit. The record is the truth; the email is
only delivery.
_Avoid_: receipt (unqualified), invoice email

**Document number series**:
A per-document-type legal numbering sequence allocated transactionally under a
row lock, so failed issuance consumes no number and the series has no gaps.
_Avoid_: sequence, auto-increment

**Event class**:
The latency tier assigned to an event by the business cost of delay (money,
operational stock/order, customer communications, projections, heavy
analytics). Each class declares a convergence window and alert threshold.
_Avoid_: priority, queue type

**Operational alert**:
A durable record that a business invariant is currently violated, at risk, or
awaiting review — with dedup identity, severity, class, and a lifecycle where
acknowledgment (operator saw it) is distinct from resolution (invariant no
longer violated). Not a log line.
_Avoid_: notification, log, warning

**Liveness sentinel**:
The single external uptime monitor that pings the health endpoint — the
accepted boundary-condition exception to self-sufficiency, because a system
cannot report its own death.
_Avoid_: uptime bot, external monitor (unqualified)

**Gate L1 (referral storefront launch)**:
The first public day — a truthful supplier-MOR referral storefront with a
verified capsule. No Elysia-processed customer money. "Live" at L1 never
implies permission to take money.
_Avoid_: launch (unqualified), go-live

**Gate L2 (own commerce activation)**:
The first shekel Elysia touches as merchant of record — unlocked only by the
structural `OWN_COMMERCE_ENABLED` checklist (money outbox, CardCom
verification, legal documents, inventory controls, reconciliation).
_Avoid_: phase 2, full launch

### Organization

**Branch**:
An operating unit of Elysia. Exactly one exists today and it is online-only;
public surfaces must never imply physical locations. Multi-branch structures in
the data model are deliberate future infrastructure, not current fact.
_Avoid_: store, boutique, location
