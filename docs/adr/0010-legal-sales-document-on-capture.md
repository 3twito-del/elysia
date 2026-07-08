# Every own sale issues a legal numbered document on capture; accountant is EXTERNAL-P0; adapter fallback pre-authorized

Status: accepted (2026-07-08)

For own sales, payment capture creates a **document obligation**: "a paid own
sale without a legal numbered document is not launch-ready commerce; it is an
accounting incident waiting to happen." Today `issueCustomerInvoice` is
reachable only from admin AR, quote conversion, and subscription billing —
nothing issues a document when a customer pays.

## Decisions

1. **Auto-issue on capture.** The `payment.captured` consumer (ADR 0002)
   idempotently issues a חשבונית מס-קבלה (pending accountant approval of the
   document type) for qualifying orders, rendered Hebrew/RTL, delivered by
   email as a P1 communication (ADR 0003). The CustomerInvoice record is the
   legal source of truth; email is only delivery — failed delivery never rolls
   back an issued document. Issuance failure raises an OperationalAlert
   (ADR 0007). **Issuance condition matrix (all must hold):** financialTreatment
   = OWN_SALE; merchantOfRecord = Elysia; payment provider-verified (ADR 0006);
   valid tax configuration; legal-entity details present; accountant-approved
   document type; numbering series available; allocation requirement handled or
   deemed inapplicable. Supplier-MOR dropship orders never issue Elysia
   product-sale documents (ADR 0009).
2. **Transactional document-number allocator — not a vanilla Postgres
   sequence** (sequences leak numbers on rollback; legal series must not).
   `DocumentNumberSeries` per document type (and per legal entity / fiscal year
   if the accountant requires): one transaction locks the series row, reads
   nextNumber, creates the CustomerInvoice with it, increments, commits — a
   failed transaction consumes nothing. Issued documents are immutable
   evidentiary records under ADR 0004 semantics: no deletion, no edit;
   correction is a credit note (זיכוי) or corrective document, append-only.
   Unique constraints on (series, invoiceNumber) and on the source money event.
3. **EXTERNAL-P0 — Israeli רו"ח engagement** with a written checklist:
   document type for prepaid B2C; VAT rate and effective-dating; VAT-inclusive
   pricing; required document fields; digital-delivery (מסמכים ממוחשבים) and
   retention rules; cancellation/credit/refund/chargeback document flows;
   guest/foreign-customer treatment; shipping/discount/gift-card VAT treatment;
   חשבוניות ישראל allocation applicability; PCN874; SHAAM; and the D6 ruling —
   whether the internal system may legally issue documents and serve as the
   formal books, or whether registered software is mandatory. DOD-006 requires
   documented verification, not assumptions.
4. **Fallback adapter pre-authorized.** If the רו"ח rules internal issuance
   insufficient at launch: an approved Israeli invoicing/bookkeeping service
   issues the documents via adapter; CustomerInvoice becomes the internal
   mirror (external provider ID, number, PDF/link, status, reconciliation
   metadata); internal GL remains management books until approved. A deliberate
   PRIN-013 adapter exception: **legality outranks self-sufficiency** — launch
   does not wait for ideological purity.

## Launch acceptance criteria

No OWN_SALE paid order remains undocumented beyond SLO; duplicate processing
cannot double-issue; numbering is sequential, transactional, gap-free on
failure; corrections are append-only credit notes; document email retries via
outbox; issuance failures alert; period close refuses while paid own sales lack
documents; accountant checklist completed and stored; if external adapter used,
it is configured and tested before launch.
