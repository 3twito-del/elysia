# Full Product Benchmark

Status: master instruction document for future Elysia product benchmark reviews.

This document consolidates public UX, commerce, performance, backend, admin,
security, accessibility, SEO, QA, and release-readiness evaluation into one
repeatable benchmark workflow. It augments, but does not replace,
`docs/PUBLIC_CHANGE_GATE.md`, `docs/ELYSIA_DESIGN_MANIFESTO.md`, and
`docs/ENGINEERING_CONVENTIONS.md`.

## Purpose and Decision Rules

Use this document before implementing any customer-facing, admin-facing, or
platform-significant change that could affect product quality, user trust,
commerce conversion, operational reliability, accessibility, security, or
release confidence.

Core rules:

- Benchmark first, implement second. Do not edit product code until the relevant
  benchmark class has been selected and the evidence requirement is clear.
- Public design, UX, content, route structure, and commerce-control changes must
  pass the High Jewelry Reference Gate from `docs/PUBLIC_CHANGE_GATE.md`, unless
  a mandatory or explicit user-approved exception is recorded.
- Public design, UX, and copy changes should also be checked against
  `docs/ELYSIA_DESIGN_MANIFESTO.md` as an orientative, non-blocking quality
  layer. It does not add a threshold and does not override the gate.
- `PUBLIC_STRUCTURE_BENCHMARK_V4` remains the route-structure marker for public
  structural decisions.
- The 30-site public benchmark corpus is secondary evidence for public commerce
  usability. It does not overrule the 15-site High Jewelry Reference Gate for
  luxury tone, public UX, content density, visual hierarchy, or brand decisions.
- Mandatory legal, accessibility, payment, SEO, cookie, and backend-correctness
  changes may proceed as mandatory exceptions, but the exception must be named
  and recorded.
- Technical changes that do not touch the public UI still need benchmark review
  against internal product quality parameters: correctness, latency, failure
  behavior, observability, auth, data integrity, and release gates.

## Benchmark Sources and Evidence Hierarchy

Evidence must be cited from the strongest applicable source. When sources
conflict, use the higher-ranked source unless the change is a mandatory
exception.

1. Mandatory requirements: legal compliance, accessibility, payment correctness,
   security, privacy, SEO correctness, backend correctness, and data integrity.
2. High Jewelry Reference Gate: the 15 Tier A high jewelry sites listed in
   `docs/PUBLIC_CHANGE_GATE.md`, each weighted `1.5`, total `22.5`, threshold
   `11.25`.
3. Public structure policy: `PUBLIC_STRUCTURE_BENCHMARK_V4` and the route
   archetypes enforced in `src/lib/public-structure-policy.ts`.
4. Public commerce benchmark corpus: the 30-site corpus defined in
   `src/lib/public-design-policy.ts`, total weight `37.5`, threshold `18.75`.
5. Elysia Design Manifesto: the orientative, non-blocking design authority in
   `docs/ELYSIA_DESIGN_MANIFESTO.md`, used to choose the quieter and more
   product-led implementation when supported options remain.
6. Repository QA truth: route inventory, performance QA, visual QA, smoke tests,
   e2e coverage, build checks, coherence checks, and production-readiness gates.
7. Product-specific operational evidence: current code behavior, database
   schema, provider contracts, logs, artifacts, support risks, and documented
   business rules.

Every benchmark record should identify source type, evidence URL or local file,
route or subsystem, observed pattern, score contribution, and final decision.

## Public Luxury and Commerce Comparison Model

Public-facing changes are evaluated through two overlapping lenses:

- Luxury authority: brand restraint, typographic hierarchy, visual polish,
  content density, navigation tone, media treatment, and purchase confidence.
- Commerce utility: product discovery, filters, sorting, cart flow, checkout
  clarity, recovery states, availability language, and service access.

Use the High Jewelry Reference Gate for:

- First viewport composition and hero behavior.
- Header, mobile navigation, footer, and global chrome.
- PLP, search, gifts, PDP, checkout, account, service, content, legal, AI, and
  stylist public structure.
- Whether an element is allowed, demoted, removed, or mandatory.
- Copy density, visual tone, button prominence, motion level, and brand
  restraint.

Use the 30-site public benchmark corpus for:

- Common commerce controls and their placement.
- Result counts, active refinements, sort behavior, wishlist, sale badges,
  service links, related products, and checkout reassurance.
- Secondary confirmation when the luxury gate allows more than one acceptable
  implementation.

## Route Benchmark Matrix

Use this matrix to select the required benchmark lens for a route or feature.

| Route or subsystem     | Primary benchmark lens                    | Required comparison focus                                                 |
| ---------------------- | ----------------------------------------- | ------------------------------------------------------------------------- |
| `/`                    | High Jewelry Reference Gate               | Brand-led first viewport, immediate commerce entry, restrained actions    |
| `/search`              | Public structure and commerce corpus      | Search controls, result summary, recovery states, filters, product grid   |
| `/gifts`               | Public structure and commerce corpus      | Product-listing behavior, gift discovery, no scroll-gated landing pattern |
| `/category/[slug]`     | Public structure and commerce corpus      | Title, count, filters, sort, active filters, grid density                 |
| `/product/[slug]`      | High Jewelry and commerce corpus          | Gallery, purchase panel, facts, availability, service, related products   |
| `/checkout`            | Mandatory correctness and commerce corpus | Cart, form clarity, payment confidence, validation, submit recovery       |
| `/account`             | Task-first product benchmark              | Auth, dashboard recovery, privacy, order access, protected states         |
| `/account/orders/[id]` | Task-first product benchmark              | Order facts, support actions, auth boundaries, data correctness           |
| `/service`             | High Jewelry and task-first benchmark     | Contact channels, service form, recovery paths, compact hero              |
| `/ai` and `/stylist`   | Demoted service benchmark                 | Tool-first layout, non-primary public placement, clear failure states     |
| `/about` and `/faq`    | High Jewelry content benchmark            | Readability, restrained content density, service recovery links           |
| Legal routes           | Mandatory and accessibility benchmark     | Compact readable content, compliance, privacy, cookie access              |
| `/offline` and PWA     | Reliability benchmark                     | Offline copy, recovery, caching behavior, no broken commerce promise      |
| Admin routes           | Operational benchmark                     | Auth, data integrity, auditability, workflow speed, error recovery        |
| API routes             | Backend benchmark                         | Response shape, validation, rate limits, auth, provider failure handling  |

## Full Product Comparison Parameters

Apply only the parameters relevant to the change, but do not ignore a category
when the touched surface clearly affects it.

### Public UX and Brand

- Brand tone: restrained, jewelry-specific, premium, clear, and not generic SaaS.
- First viewport: the route's primary task or brand signal appears without
  decorative obstruction.
- Navigation: compact, typographic, accessible, route-backed, and consistent
  across desktop and mobile.
- Header and footer: utility-led, service-aware, not boxed or pill-heavy, and
  not overloaded with unsupported routes.
- Mobile behavior: stable tap targets, readable labels, no occluded controls,
  safe-area awareness, Escape and focus-return behavior where applicable.
- Motion: purposeful, not continuous outside approved hero contexts, and safe
  under reduced-motion preferences.
- Content density: concise enough for luxury tone while preserving task clarity.

### Commerce Discovery

- PLP, search, and gifts: title, result count or range, filters, sort, active
  chips, recovery state, and grid appear before storytelling.
- Filters: understandable labels, no misleading option counts, keyboard access,
  reset behavior, and mobile sheet behavior.
- Product cards: stable aspect ratio, responsive image sizes, price formatting,
  wishlist state, sale state only when backed by data, and no invented stock
  precision.
- Search: query persistence, empty-state recovery, route shareability, and no
  hidden critical controls.
- Category and gift routes: behave as commerce listings, not local anchor-driven
  landing pages.

### Product Detail and Purchase Confidence

- PDP first screen: gallery and purchase panel lead; service and related content
  follow.
- Product facts: name, price, material, availability, configurable options,
  sizing, and care/service information are clear.
- Availability: generic confidence language is allowed; exact public inventory
  counts are not allowed unless a future approved policy changes this.
- Trust: delivery, returns, support, and secure payment copy stays near purchase
  or submit context.
- Related products: secondary rail after purchase context, not a replacement
  for product facts.

### Checkout, Account, and Service

- Checkout: cart state, form fields, validation, payment state, submit progress,
  and error recovery are explicit and testable.
- Payment: no optimistic success without provider confirmation; webhooks and
  callbacks must fail closed.
- Account: protected states, sign-in recovery, order access, privacy export, and
  empty states are clear.
- Service: contact options, service request flow, response expectations, and
  failure states are visible.
- AI and stylist: tool-first service surfaces, not primary public navigation or
  commerce CTAs.

### Performance and Frontend Reliability

- Web Vitals: LCP, CLS, INP, long tasks, navigation timing, and route-level
  budgets are considered for public routes.
- Images: `next/image` fill usage includes explicit `sizes`; only initial
  above-the-fold media is prioritized; hidden media is not prioritized.
- Layout stability: boards, grids, galleries, cards, controls, and dynamic text
  have stable dimensions and responsive constraints.
- Loading states: user-visible async states use consistent loading, empty, and
  error surfaces.
- Route latency: performance QA route subset must stay representative of home,
  search, category, PDP, checkout, account, AI, and service.
- Asset drift: production build must preserve AVIF conversion expectations.

### Backend, API, and Data Integrity

- API response shape: preserve public contracts and use shared response helpers.
- Validation: all I/O boundaries validate input before calling services.
- Rate limits: protected and expensive endpoints include correct rate-limit
  behavior and `Retry-After` where applicable.
- Service boundaries: business logic stays in services; adapters wrap external
  providers; route handlers do not own transactions.
- Provider failure: failures are explicit, logged where useful, and do not leak
  secrets or corrupt state.
- Database dependency: local and preview behavior must be documented when using
  fixtures or fallbacks; production must fail clearly if required providers are
  missing.
- Idempotency: webhooks, jobs, and payment flows avoid duplicate side effects.

### Admin, Security, SEO, and Observability

- Admin workflows: authenticated, task-dense, auditable, and recoverable.
- Auditability: high-impact admin actions produce traceable state or logs.
- Auth: protected routes fail closed and preserve safe redirects.
- Security: no secret exposure, no unsafe redirects, no unauthenticated mutation,
  no public admin data leakage.
- SEO: public metadata, canonical behavior, indexability, structured content,
  and route status behavior remain intentional.
- Accessibility: landmarks, focus states, names, keyboard paths, contrast,
  reduced motion, and collision rules are verified for touched surfaces.
- Observability: smoke, health, logs, and artifact outputs support debugging
  without exposing sensitive data.

## Scoring and Pass/Fail Rules

Use explicit scoring only where a weighted benchmark exists.

| Benchmark class             |  Total | Threshold | Pass rule                                                            |
| --------------------------- | -----: | --------: | -------------------------------------------------------------------- |
| High Jewelry Reference Gate | `22.5` |   `11.25` | Support from at least 8 of 15 Tier A sites                           |
| Public benchmark corpus     | `37.5` |   `18.75` | Weighted score meets or exceeds threshold                            |
| Public structure policy     | `37.5` |   `18.75` | Decision is `allow` or `mandatory`                                   |
| Mandatory correctness       |    N/A |       N/A | Passes when the requirement is real, named, and implemented narrowly |
| Technical QA                |    N/A |       N/A | Passes when required checks for touched surface pass                 |

Decision statuses:

- `allow`: implement as requested or with minor adaptation.
- `demote`: keep only as secondary, non-primary, or lower-prominence behavior.
- `remove`: do not implement; remove or avoid the element unless an explicit
  exception is approved.
- `mandatory`: implement narrowly because legal, accessibility, payment, SEO,
  cookie, security, privacy, or backend correctness requires it.

When scoring is not available, document qualitative evidence, affected risk,
required checks, and the reason the decision is still safe.

## Required Evidence Format

Use this row format when collecting external or repository evidence:

| Field                | Required content                                                       |
| -------------------- | ---------------------------------------------------------------------- |
| Benchmark date       | ISO date of review                                                     |
| Route or subsystem   | Route, API, admin area, service, or component family                   |
| Change request       | One-sentence description                                               |
| Source               | Site name, local file, command, artifact, or provider contract         |
| Source type          | High Jewelry, corpus, public structure, QA, code, legal, security, ops |
| Evidence URL or path | URL, file path, command output artifact, or test name                  |
| Observed pattern     | What the source actually supports                                      |
| Weight or confidence | Weighted score, mandatory flag, or qualitative confidence              |
| Decision             | `allow`, `demote`, `remove`, or `mandatory`                            |
| Notes                | Caveats, conflicts, missing evidence, or implementation constraints    |

Feature decision record template:

```md
## Benchmark Decision: <feature/change>

- Date:
- Owner:
- Route/subsystem:
- Request:
- Benchmark class:
- Evidence:
- Score:
- Decision:
- Mandatory exception, if any:
- Implementation constraints:
- Required verification:
- Final notes:
```

Exception record template:

```md
## Benchmark Exception: <feature/change>

- Date:
- Exception type:
- Approver:
- Reason the benchmark did not pass:
- Reason implementation is still required:
- Narrowest acceptable implementation:
- Follow-up verification:
```

## Future Implementation Workflow

1. Classify the change as public UX, commerce, performance, backend/API, admin,
   security, accessibility, SEO, QA, release, or mixed.
2. Identify the route or subsystem and select the benchmark lens from the route
   matrix.
3. Collect evidence using the hierarchy above. For public UX, start with the
   High Jewelry Reference Gate.
4. Score weighted benchmarks when available. Record qualitative evidence when
   weighted scoring is not available.
5. Choose `allow`, `demote`, `remove`, or `mandatory`.
6. If the decision is `remove`, stop before editing files unless the user
   explicitly approves an exception.
7. If the decision is `demote`, implement only the lower-prominence version.
8. If the decision is `mandatory`, keep the change narrow and record the
   mandatory reason.
9. Implement using existing repo boundaries and UI conventions.
10. Run the smallest verification set that covers the touched surface.
11. Record benchmark score, exceptions, checks, and artifacts in the work
    summary or follow-up change note.

Implementation readiness checklist:

- [ ] The change class and route/subsystem are identified.
- [ ] The relevant benchmark source is selected.
- [ ] Evidence is recorded with URLs, paths, or command artifacts.
- [ ] Weighted score or mandatory reason is documented.
- [ ] Public structure policy is checked for public route changes.
- [ ] Accessibility and collision risks are considered.
- [ ] Security, auth, privacy, and provider failure risks are considered.
- [ ] Required verification commands are selected.
- [ ] Exception, if any, is explicit and narrow.

Route benchmark checklist:

- [ ] First viewport supports the route's primary job.
- [ ] Header, navigation, footer, and global chrome remain consistent.
- [ ] Primary commerce controls are visible before decorative content.
- [ ] Mobile controls fit, remain tappable, and do not overlap.
- [ ] Loading, empty, error, and recovery states are covered.
- [ ] Focus, keyboard, reduced motion, and accessible names are covered.
- [ ] Images, layout dimensions, and text fit are stable.
- [ ] Auth, data, provider, and payment behavior fail safely.

## QA and Verification Commands

Choose the smallest command set that covers the change. Escalate only when the
surface area or failure signal justifies it.

| Command               | Use when                                                                                                   |
| --------------------- | ---------------------------------------------------------------------------------------------------------- |
| `pnpm format:check`   | Documentation, formatting, or Markdown drift                                                               |
| `pnpm verify:fast`    | Ordinary local changes needing lint, typecheck, and tests                                                  |
| `pnpm check`          | Legacy alias for lint, typecheck, and tests                                                                |
| `pnpm test`           | Focused unit or integration behavior changed                                                               |
| `pnpm qa:routes`      | Route inventory or app route coverage changed                                                              |
| `pnpm qa:performance` | Public performance, images, layout, or route timing changed                                                |
| `pnpm smoke`          | API health, core HTTP behavior, or preview smoke coverage changed                                          |
| `pnpm e2e`            | Public UI, commerce flow, responsive, auth, or route structure changed                                     |
| `pnpm visual:qa`      | Visual polish, overlays, mobile layout, or collision risk changed                                          |
| `pnpm build`          | Next.js config, assets, production behavior, or route rendering changed                                    |
| `pnpm gate:coherence` | Architecture boundaries, services, adapters, APIs, or shared contracts changed                             |
| `pnpm gate:runtime`   | Preview-only runtime behavior, smoke, e2e, and visual risk changed                                         |
| `pnpm gate:ship`      | Routine pre-deploy release validation                                                                      |
| `pnpm verify:full`    | Deliberate full release verification with DB, provider secrets, network, and live benchmark time available |

Doc-only benchmark updates normally require only `pnpm format:check`. They do
not require browser, DB, build, or live benchmark execution unless the document
change also updates code, tests, gates, or generated artifacts.

## Exception Handling and Change Notes

Exceptions are allowed only when they are mandatory or explicitly approved.
Record them in the work summary or follow-up change note.

Required exception fields:

- Benchmark that failed or was bypassed.
- Score or qualitative reason.
- Exception type: accessibility, legal, payment, SEO, cookie, security,
  privacy, backend-correctness, or explicit user-approved exception.
- Narrowest implementation that satisfies the exception.
- Verification commands or artifacts.
- Remaining risk.

Change note template:

```md
Benchmark summary:

- Class:
- Route/subsystem:
- Decision:
- Score:
- Evidence:
- Exception:
- Verification:
- Residual risk:
```

If future benchmark evidence conflicts with this document, update this document
and the enforcing code or tests together. Do not silently drift the docs, policy
constants, and implementation behavior apart.
