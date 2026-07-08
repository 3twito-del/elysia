# L1 legal/compliance package: lawyer EXTERNAL-P0, verified identity, consent proof, statutory a11y, replay off

Status: accepted (2026-07-08)

L1 avoids customer-money obligations but not public-law obligations — a
referral storefront is still a legal surface: it collects personal data,
displays product claims, routes customers into a supplier checkout, presents
seller identity, uses licensed media, and creates reliance.

## Decisions

1. **Lawyer engagement — EXTERNAL-P0 for L1**, distinct from the רו"ח (who
   governs tax/invoices/books). Lawyer scope: referral/intake terms; Elysia's
   role vs supplier's; seller-identity and click-out disclosure wording;
   consumer-protection review; privacy policy under Israeli law incl.
   Amendment 13; cookie/consent language; media-licensing sanity;
   accessibility-statement wording; refund/return responsibility split. The
   key question the lawyer must answer: is Elysia a seller, marketplace,
   referral agent, marketing site, intake layer, or hybrid — and the public
   copy must match that answer.
2. **Legal identity truth — OWNER-P0.** Verified entity name, registration
   number, address, service contacts, privacy contact, accessibility contact,
   supplier/MOR identity where displayed — across footer, terms, privacy,
   accessibility statement, contact, checkout handoff, PDP seller block.
   `legal-placeholder-grid` dies or is filled with verified facts. Placeholders
   on legal surfaces are fabricated legal substance. **No verified legal
   identity, no L1.**
3. **Cookie/consent behavioral proof — Engineering NOW.** The banner is not
   the control; the evidence is: tests proving zero measurement events (and no
   replay) fire pre-consent; withdrawal stops collection; rejection is
   respected as a choice; decisions persist append-only in `ConsentRecord`,
   timestamped and attributable where lawful; no marketing/push subscription
   is created from mere browsing.
4. **Accessibility — statutory L1 matter.** Capsule-scoped public routes
   (home, capsule categories/PDPs, search, handoff, contact, legal pages,
   consent surfaces, account/login) conform to the statutory baseline
   (ת"י 5568); WCAG 2.2 AA remains the higher engineering target; the published
   הצהרת נגישות states what was tested, the standard claimed, known
   non-conformances, contact, and review date — an honest partial statement
   over a false perfect one. Widget stays but does not substitute for
   conformance; D-07 collision audit applies.
5. **Session replay: OFF at L1 (hard default).** rrweb replay serves no
   L1-critical purpose and creates privacy risk before a mature compliance
   function exists. Re-enable only post-launch with lawyer approval AND strict
   consent gating, field masking, no payment/sensitive capture, retention
   limit, access audit, deletion workflow, policy disclosure, and pre-consent
   tests.

## Acceptance criteria

Lawyer reviews complete across the scope; identity facts verified and
placeholders removed; consent tests green; statutory a11y review of capsule
routes with an honest statement; replay disabled or lawyer-approved
consent-gated.
