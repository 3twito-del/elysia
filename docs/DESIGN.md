# Elysia Design

Status: single source of truth for public Elysia design, UX, content,
structure, and commerce-control decisions. This document merges the former
`PUBLIC_CHANGE_GATE.md` (the blocking gate), `ELYSIA_DESIGN_MANIFESTO.md`
(the orientative layer), and the standing invariants locked in by the
completed Tiffany-plus passes.

Implementation markers retained in code:

- `HIGH_JEWELRY_REFERENCE_GATE`
- `PUBLIC_STRUCTURE_BENCHMARK_V4`
- `ELYSIA_DESIGN_MANIFESTO`

Authority order when sources conflict:

1. Mandatory legal, accessibility, payment, security, privacy, SEO, and backend
   correctness requirements.
2. High Jewelry Reference Gate (Part I — blocking).
3. Public structure policy and route archetypes (Part I — blocking).
4. Design manifesto (Part II — orientative, non-blocking).
5. Local implementation preference.

---

## Part I — Public Change Gate (blocking)

### Purpose

This gate prevents public-facing changes from being implemented only because
they were requested locally. Every future public UI, UX, content, structure, or
commerce-control change must be checked before code is edited.

Rule: unsupported means no implementation until explicit exception. If a
requested change does not pass the weighted gate, the implementer must say that
it is not supported by the High Jewelry Reference Gate, cite the score and
reason, and stop before editing files. Implementation may continue only after
the user explicitly approves an exception, and that exception must be recorded
in the work summary or follow-up change note.

The design manifesto (Part II) is the orientative design authority after this
gate. It helps choose between supported implementations and keeps the public UI
aligned with the Elysia house point of view, but it is non-blocking and
does not approve a change that fails the High Jewelry Reference Gate.

### High Jewelry Reference Gate

The Tier A-only high jewelry gate uses 15 Tier A high jewelry sites. Each site
has weight `1.5`, for a total weight of `22.5`. The pass threshold is `11.25`,
which requires support from at least 8 of 15 sites.

Site-list note (2026-07-10): 8 of the originally-named sites (Tiffany & Co.,
Van Cleef & Arpels, Bulgari, Harry Winston, Graff, Boucheron, Chaumet, Piaget)
are not reachable by this repository's automated research tooling — confirmed
across two independent verification passes with fresh URLs, consistently
returning bot-edge `403`, connection timeout, or `ECONNRESET` (see
`docs/qa/mobile-pdp-rail-density-benchmark.md` for the full evidence trail).
A site that cannot be verified cannot support or block a gate score, so each
was replaced with a comparable fine/high-jewelry maison confirmed reachable
by the same tooling. See the ADR in `docs/DECISIONS.md` ("High Jewelry
Reference Gate site-list substitution") for the decision record. If future
tooling can reach the original 8, they may be restored; until then this is
the list of record. `Mikimoto`'s source URL is also updated below —
`mikimoto.com` redirects to the Japan site; `mikimotoamerica.com` is the
reachable US storefront actually used for verification.

| Site           | Source URL                             | Weight |
| -------------- | --------------------------------------- | ------ |
| Cartier        | https://www.cartier.com/en-us/jewelry/  | 1.5    |
| Repossi        | https://intl.repossi.com/en-us          | 1.5    |
| Garrard        | https://www.garrard.com/en-us/          | 1.5    |
| Vhernier       | https://www.vhernier.com/en-us/         | 1.5    |
| Verdura        | https://verdura.com/                    | 1.5    |
| Chopard        | https://www.chopard.com/en-us           | 1.5    |
| Suzanne Kalan  | https://suzannekalan.com/               | 1.5    |
| Anna Sheffield | https://www.annasheffield.com/          | 1.5    |
| Jessica McCormack | https://us.jessicamccormack.com/     | 1.5    |
| Mikimoto       | https://www.mikimotoamerica.com/us_en   | 1.5    |
| Messika        | https://www.messika.com/us_en/          | 1.5    |
| Buccellati     | https://www.buccellati.com/en_us/home   | 1.5    |
| De Beers       | https://www.debeers.com/en-us/home      | 1.5    |
| Pomellato      | https://www.pomellato.com/              | 1.5    |
| Roberto Coin   | https://robertocoin.com/                | 1.5    |

### Required Workflow

1. Classify the request as public design, UX, content, structure, or commerce
   control. Admin-only and internal technical changes are outside this gate
   unless they affect the public UI.
2. Map the request to the closest route context: home, PLP/search/gifts, PDP,
   checkout, service, account, content, legal, or global UI.
3. Compare the requested change against relevant screens in the 15-site gate.
   Use the broad 30-site public benchmark corpus only as secondary commerce
   usability context; the high-jewelry gate wins for luxury, content, and
   design-tone decisions.
4. Read Part II of this document as the orientative layer for tone, restraint,
   spacing, media, copy, mobile, and commerce emphasis.
5. Record support as site names plus evidence URLs, then calculate the weighted
   score. A score of at least `11.25` means supported and implementable.
6. If the score is below `11.25`, mark the request as unsupported and do not
   edit code. The user may approve an explicit exception; if so, record the
   exception and implement with the exception called out.
7. Mandatory legal, accessibility, payment, SEO, cookie, and backend-correctness
   changes may pass as mandatory exceptions, but the exception must still be
   explicit.

Example: for an About copy reduction, compare Elysia against Maison, About,
heritage, and story pages in the 15-site corpus. If at least 8 sites support
shorter, more restrained content density, the change can proceed. If not, the
implementer must state that the About copy reduction is unsupported by the gate
and wait for an explicit exception before editing.

### Public Structure Policy

`PUBLIC_STRUCTURE_BENCHMARK_V4` remains the code marker for structural public
route policy. It is enforced through `src/lib/public-structure-policy.ts` and
tests, but this document is the only doc artifact.

Required structural decisions:

- Gifts remains a product-listing route, not a scroll-gated landing page.
- PLP, search, and gifts prioritize result summary, filters, sorting, recovery,
  and product grids before storytelling.
- PDP prioritizes gallery, product facts, availability, add-to-cart, and
  recommendation rails without exact public inventory counts.
- Checkout, service, account, AI, stylist, legal, and content routes use compact
  task-first heroes and must not rely on adjacent same-page hero CTAs.
- Hero actions are allowed only when they navigate to a different public task or
  trigger a real control. Same-page anchors are disallowed when the target is
  adjacent, already within the first viewport, or simply advances to the next
  section.
- Floating chrome, cookie controls, accessibility controls, and sticky commerce
  controls must not cover focusable or purchasing controls.

### Header Configuration Policy

Any public header change must first be classified by these aspects:

- Chrome anatomy: promo/location strip, primary row, secondary row, drawer,
  sheet, or utility rail.
- Brand mark: wordmark, monogram, house symbol, sizing, position, and whether
  decorative marks are used.
- Navigation taxonomy: high jewelry, jewelry, category, collection, bridal,
  gifts, maison/about, service, watches, and editorial paths.
- Utility access: search, store/location, contact/service, account, wishlist,
  cart, language, country, currency, and appointment paths.
- Commerce state: cart count, saved-item state, availability/service entry
  points, and whether a utility is backed by a real route.
- Interaction model: static, sticky, hide-on-scroll, dropdown, mega menu,
  drawer, sheet, active state, hover, keyboard, and focus restoration.
- Responsive model: desktop row density, tablet breakpoint, mobile menu
  trigger, tap targets, safe-area behavior, and text fit.
- Visual tone: typographic links, neutral chrome, restrained borders,
  low-shadow surfaces, no boxed public navigation, and no decorative pills.
- Accessibility: skip links, landmarks, `aria-current`, `aria-expanded`,
  accessible names, reduced motion, Escape close, and focus return.
- Localization and compliance: country/language selectors only when backed by
  real service, legal/accessibility links, and cookie-control collision rules.

Canonical decision from the 15-site high-jewelry gate:

- The header stays compact, sticky, typographic, and utility-led.
- The public header and mobile navigation use a clean Elysia wordmark only;
  generic gem icons are not used inside the header brand mark.
- Primary navigation remains category/task oriented and unboxed.
- Utilities must expose search, location/service, account, and cart when those
  routes exist; unavailable physical locations may resolve to the service route.
- Mobile navigation mirrors the desktop taxonomy through a sheet/drawer with
  compact quick actions and separate catalog/service groups.
- AI/stylist remains out of primary header navigation.

### Historical Decisions

Historical gate decisions are folded into this document and the enforcing code:

- `DCH-023`: Public benchmark corpus v3 established the fixed global commerce
  benchmark as secondary evidence.
- `DCH-032`: Public structure benchmark v4 established structural route
  archetypes for public pages.
- `DCH-041`: High jewelry reference gate requires all future public UI, UX,
  content, structure, and commerce-control changes to pass
  `HIGH_JEWELRY_REFERENCE_GATE` unless a mandatory or explicit user-approved
  exception is recorded.

### Verification Chain

Before shipping a public change:

1. Apply this gate before editing code.
2. Implement only the supported or explicitly excepted change.
3. Run `pnpm check`.
4. Run `pnpm build`.
5. Run `pnpm e2e` for public UI, commerce flow, responsive, accessibility, or
   route-structure changes.
6. Push only after local verification passes, then require the GitHub `Quality`
   workflow and Vercel deployment to complete successfully.

---

## Part II — Design Manifesto (orientative, non-blocking)

Marker: `ELYSIA_DESIGN_MANIFESTO`

Status: orientative design authority for public Elysia design decisions. This
manifesto is non-blocking. It guides taste, hierarchy, composition, copy,
media, mobile behavior, and commerce tone, but it does not replace
`HIGH_JEWELRY_REFERENCE_GATE`, `PUBLIC_STRUCTURE_BENCHMARK_V4`, mandatory
legal/accessibility/payment requirements, or explicit user-approved exceptions.

### Authority

Use this manifesto as the default design reading when more than one supported
implementation is possible. It gives the work a house point of view without
creating a new gate, a new score, or a new blocking policy. It sits below the
gate and the Public structure policy in the authority order, and above
Local implementation preference.

The manifesto may recommend restraint, demotion, or a more precise expression.
It may not approve a public design change that fails the High Jewelry Reference
Gate unless a mandatory exception or explicit user-approved exception exists.

### House Idea and Positioning

Marker: `ELYSIA_HOUSE_IDEA` — owner-confirmed 2026-07-15, the acceptance
record for A-01 (`docs/TASKS.md`: "define the unmistakable house idea").
This is the brand-truth source the "House Point Of View" manifesto below
already expressed in visual/UX terms without yet having a written origin —
the two are the same idea in two registers, design and positioning.

**The house idea, one line:** Elysia is European classical jewelry-making
in an old-money register — refinement without logo-driven noise — priced so
that good taste is not a luxury tax.

**The owned tension:** classic timelessness held against a live, current
market. Elysia is not nostalgic and not trend-chasing — it stays legibly
European and classical while continuing to read as relevant now, not dated.

**What Elysia is not, on purpose** (the acceptance test for A-01: an
independent reviewer should describe Elysia this way, not as
"Tiffany-like"):

- Not a status-logo brand. The explicit premise: some prestige brands
  charge for a visible logo on a piece that is not, on its own merits,
  beautiful. Elysia's bet is the opposite trade.
- Not "affordable jewelry" in the discount sense. The tone/restraint
  reference point is Loro Piana — quiet, understated, confident — without
  Loro Piana's price.
- Not loud, trend-driven, or gimmick-led in design. European, classical,
  free of decorative gimmicks.

**Target customer:** an "old money" aesthetic sensibility — conservative,
elegant, unwilling to overpay for a logo, past needing visible brand
signaling to feel secure in their own taste. Innovative within a classical
register, not outdated. A reasonable price range, not entry-level discount.

**Voice:** sparse, reserved, warm rather than cold — few words, said with
confidence, not distance for its own sake.

**Language rule (A-03, partial closure):** Hebrew is the default register
for all copy. English is used only for memorable slogans or short phrases
whose specific effect would be lost in translation — never as a default
register. (Transliteration conventions, numerals/currency, and CTA verb
standards remain open under A-03.)

**Verified supply-chain fact (A-04 fact bank; also feeds C-07)**: Elysia
currently works with dropship suppliers, with limited product-customization
room. This is a real, current operating fact, not a caveat to hide — public
copy must not imply in-house manufacture or bespoke craftsmanship this
arrangement doesn't support. Greater direct supplier involvement is a
possible future direction, not a current fact — do not write it as one.

**Still genuinely open, not fabricated here:** no named hero piece exists
yet (blocks A-05's collection architecture); the concrete shape of the
post-purchase personal note (A-06) beyond "a personal message" is not yet
specified — needs its own follow-up, not invented.

### House Point Of View

Elysia should feel quiet, precise, intimate, and product-led. Luxury is not
created by visual weight. It is created by reduction, proportion, confident
spacing, material clarity, and a purchase path that never feels noisy.

The interface should help the customer inspect a piece, understand the material,
compare calmly, and continue with confidence. The site should not perform luxury
with decorative excess. It should make the product, the price, and the next
action feel inevitable.

### Operating Principles

- Reduction creates value. Remove repeated explanations, extra badges, doubled
  CTAs, decorative panels, and copy that restates what the layout already says.
- Space should breathe, not drift. Empty space is useful when it frames product,
  reading, or action. Empty space becomes failure when it disconnects the user
  from the next decision.
- Product and material come first. Photography, crop, texture, metal, gemstone,
  scale, and fit outrank icons, labels, illustrations, and explanatory text.
- Hero sections should stay clean and selective. A hero may carry a strong
  image, brand signal, short copy, and one clear action, but it should avoid a
  large set of competing elements, metrics, badges, secondary panels, or
  repeated CTAs. Home leads with a clean hero with a limited number of elements.
- Composition should be calm but accountable. Every major area should answer:
  what is this, why does it matter, and what can the customer do next?
- CTAs are contextual. Prefer a small number of clear actions close to the
  relevant product, price, form, or decision. Avoid artificial urgency.
- Service supports trust. Service belongs near purchase confidence, recovery,
  sizing, warranty, return, and contact moments. It should not become the center
  of the public site unless the route itself is a service route.
- Mobile is not compressed desktop. The first image, price, selected option,
  thumb-sized CTA, and key reassurance should appear before long text.
- Copy should be human before it is legal. Lead with concise, plain language;
  legal precision can follow where required.
- Color, badges, and labels should differentiate. They should not create noise,
  urgency, or a catalog feeling when the product data does not require it.

### Public Surface Guidance

- Home should make the brand and product world visible quickly through a clean
  hero with a limited number of elements, then give clear commerce entry points
  without overloading the first viewport.
- Search, category, and gift routes should behave as commerce listings first:
  count, filters, sort, active refinements, product cards, and recovery states
  should be easier to find than storytelling.
- Product pages should lead with gallery, product facts, material, price,
  options, availability language, and purchase confidence. Service, care, FAQ,
  and related products should support those facts.
- Checkout should be short, explicit, and calm. Product, quantity, price,
  delivery, return, warranty, secure payment, and the payment action should be
  visible without creating a manual approval feeling.
- Content routes should read like short proof, not institutional padding. If a
  story is not specific, verifiable, or useful, shorten it.
- Footer and global chrome should stay utility-led. They should not become a
  second landing page or a dense directory unless the route requires it.

### Default Review Questions

Before implementing a public design, UX, or copy change, ask:

- Is the product or the task clearer after this change?
- Did we remove more noise than we added?
- Does the spacing create orientation, not abandonment?
- Is the CTA close to the decision it completes?
- Does mobile show image, price, and action early enough?
- Is service supporting trust instead of stealing focus?
- Would this still feel premium if all animation and decorative effects were
  removed?

If the answer is unclear, prefer the quieter implementation and record any
intentional deviation in the work summary.

---

## Part III — Standing Invariants (shipped and locked)

The Tiffany-plus program is fully implemented and verified. Its passes are no
longer tasks; they are permanent guardrails, each enforced by static contract
tests and browser smoke coverage. Regressions against them are bugs.

### Completed passes, now invariants

- **Product Page Pass** — the PDP is a purchase-decision page: gallery, price,
  availability, material, size, and delivery appear before deep scrolling; the
  primary CTA and variant selection stay unambiguous; size guide, returns, and
  warranty live inside the buy area. PDP contract tests block structural
  regression.
- **Checkout Confidence Pass** — mobile order summary, payment/delivery/return
  trust signals, actionable form errors, and empty-cart recovery are required
  behavior.
- **Search / Category Polish** — grid/list/filter/sort distinctions must be
  clear at every viewport; every state button shows a clear active state; no
  two state buttons may look identical.
- **Product Cards Luxury Pass** — clean hierarchy for name, price, material,
  availability; stable image ratio; hover/focus without layout shift; precise
  unavailable/sale states via `data-product-card-availability` /
  `data-product-card-sale`; badge system via `getProductCardLabel`.
- **Trust Layer** — a global footer trust layer (`footer-trust-layer`) links
  shipping-returns, size-guide, warranty, and service; trust blocks sit at PDP,
  checkout, footer, and service decision points; copy stays short, factual,
  and free of unverified promises.
- **Visual QA Mobile First** — every public visual change is verified at the
  390x844 mobile viewport and the 1440x900 desktop viewport with a
  zero-console-error budget; evidence is recorded in `docs/QA_EVIDENCE.md`.
- **Guardrails** — static tests forbid: legacy turquoise/aqua colors,
  decorative gradients, nested card surfaces, identical-looking state buttons,
  clipped mobile text, abnormal letter-spacing in public text, and repeated
  icons across distinct static lists.

### Token and theme decisions (shipped)

- Public headings use ink (`--elysia-heading`); muted headings must not return.
- Focus rings use opaque bronze; muted/input tones are pinned darker for
  contrast. Token values are pinned in style tests.
- Night mode is a warm espresso `.dark` palette with the theme preference in
  `localStorage` (`elysia.theme-preference`) and a no-FOUC boot script; the
  admin surface is light-only by design.
- Audits of interaction states must cover hover/focus/active/selected in both
  light and dark and re-measure contrast; static scans alone are insufficient.

### Design workflow invariants

- Mobile first: every change is checked at 390px before desktop.
- Every interactive component shows a clear active state.
- Text must not clip, overlap, or hide purchase actions.
- Every design change lands with a guardrail: a static contract test or a
  browser-smoke assertion.
