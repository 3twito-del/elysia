# About Page Redesign QA

Generated: 2026-05-20

## Baseline signals

Local benchmark reviewed before the redesign.

Key mismatches before redesign:

- Desktop about height: Elysia 5203px vs corpus median 3935px.
- Tablet about height: Elysia 6263px vs corpus median 3815px.
- Mobile about height: Elysia 9639px vs corpus median 4767px.
- Media: Elysia image count 0 in measured about content vs corpus median 18 desktop and 22 tablet.
- Density: link and control density were below the corpus range.
- Tone: excessive aqua accents were flagged compared with the high-jewelry corpus.

## Review matrix

Checked the page across these grouped aspects:

- Structure: hero, story, values, proof points, service path, closing CTA.
- Media: count, placement, aspect ratios, crop behavior, alt text, local AVIF usage, product-first imagery.
- Layout density: section height, heading count, paragraph count, row rhythm, CTA density, white-space balance.
- Commerce clarity: paths to catalog, categories, gifts, service and search.
- RTL: Hebrew flow, right-aligned content, mixed English/Hebrew brand name handling.
- Accessibility: real image alt text, decorative icons hidden, semantic sections, visible focus inherited from buttons.
- Performance: `next/image`, local bitmap assets, fixed aspect-ratio containers, no remote image dependency.
- Motion stability: initial sections use stable reveal behavior where needed; media has reserved dimensions.
- Visual restraint: no decorative gradients, no nested page cards, no redundant framed CTA block.

## Implementation

- Replaced the text-heavy About page with a compact editorial layout.
- Added 5 body image placements plus the existing hero media sequence.
- Moved from long manifesto sections to short proof-led copy.
- Kept only one repeated card grid for values; standards and workflow are line-based rows.
- Added category, catalog, gifts and service routes without turning the page into a marketing landing page.
- Preserved the project’s low-shadow, neutral, product-led visual system.

## Acceptance checks

- Page includes local product/editorial bitmap images, not SVG illustrations.
- Body media is reserved with `aspect-*` containers to avoid layout jumps.
- No final boxed `brand-surface` CTA.
- No duplicate icons inside any static icon list.
- Text scale remains editorial, not oversized dashboard or hero type inside panels.

## Relaunch v2 (2026-07-06)

Chaptered editorial rebuild on top of the original guardrails:

- Sticky chapter navigation (`about-chapter-nav`) with IntersectionObserver
  scrollspy; anchors map to the four content chapters.
- Manifesto chapter gains a facts band (`about-stats-band`) with four factual
  numerals (925 silver, 12-month warranty, 24h response, online-only model).
- Principles chapter uses a sticky editorial figure (desktop) with numbered
  hairline rows instead of boxed cards, plus a wide banner figure with an
  in-image caption.
- Process chapter is a horizontal four-step flow with a hairline that draws
  once on reveal; vertical on mobile.
- All guardrails still hold: media-led (hero + two figures + fixed band),
  compact section padding, no `Separator`, and no final boxed `brand-surface`
  CTA. Reduced-motion and night-mode variants covered in `globals.css`.

### v2.1 owner-feedback fixes (2026-07-06)

- Hero stripped to image + scrim + copy: aurora layers, Ken Burns drift and
  title sheen removed after owner review flagged them as excessive.
- Site-wide desktop category row removed from the header (owner preference);
  header returns to the split three-column layout only.
- Principles chapter: neutralised homepage story-band layout baggage
  (50vw width / fixed grid slots) that made the figure overlap the copy.
- Service chapter rebalanced to a symmetric 4+4 card grid (facts + care,
  then trust links).
- Chapter nav aligns flex-start on mobile (no horizontal page overflow) and
  centers from lg.
- Night mode: hero primary CTA label pinned to literal ink so it stays
  readable on the cream fill.
