# Aphrodite Design Supremacy Benchmark

Date: 2026-05-08

## Reference Set

Capture the same viewport set for Aphrodite and the reference brands before each
major visual release:

- Tiffany: home, category, product, checkout entry
- Cartier: home, category, product, checkout entry
- Mejuri: home, category, product, checkout entry
- Pandora: home, category, product, checkout entry

Use desktop 1440px, tablet 768px, and mobile 390px. Store only curated
Aphrodite evidence in this directory; keep third-party screenshots outside the
repo if licensing or redistribution is unclear.

## Scoring Rubric

Score each dimension from 1 to 5. Aphrodite passes this redesign only when the
reviewed implementation beats the local reference set in at least five of seven
dimensions.

| Dimension | Reference signal | Aphrodite target | Implementation evidence |
| --- | --- | --- | --- |
| Visual hierarchy | Immediate brand/product recognition without promotional noise | Brand-first hero, dominant PDP gallery, compact catalog controls | Header is stable, home/PDP/catalog remove card-heavy framing |
| Media quality | Editorial product imagery, no repeated first-row thumbnails | Curated media registry with deterministic multi-image product sets | `src/lib/brand-media.ts`, catalog fallback, seed multi-media |
| Brand distinction | Site feels specific to jewelry, not a template | Flat editorial commerce, thin rules, disciplined type and CTAs | Global glass classes now render as restrained surfaces |
| Mobile polish | No hidden purchase actions, no overflow, no clipped controls | Sticky purchase/checkout bars stay compact and readable | PDP/checkout bars remove heavy shadow and preserve CTA visibility |
| Product clarity | Price, availability, variant and wishlist hierarchy is obvious | Gallery first, sticky purchase panel second, branch availability below | PDP grid favors media and purchase panel over form-like layout |
| Checkout clarity | Steps and summary are obvious with minimal visual load | Dense form, sticky summary, clear issues and trust text | Checkout summary is sticky and flatter; form controls are quieter |
| Accessibility | Strong focus states, readable contrast, semantic controls | Native buttons/selects, visible focus, reduced motion support | Existing semantics preserved; design tokens keep contrast deliberate |

## QA Pages

- `/`
- `/category/earrings`
- `/search?q=venus`
- `/product/venus-line-ring`
- `/checkout`
- `/account`
- `/ai`

## Decision Notes

- Avoided a generic luxury pattern of more shadows, gradients, and badges.
- Kept API, schema, and admin surfaces unchanged.
- Did not run a destructive reseed; seed changes only affect future explicit
  seed runs.
