# Elysia — Homepage Improvement Backlog

> Status: **implementation pass started 2026-06-19.**
> Implemented in this pass: secondary hero CTA, condensed scroll CTA, gift finder,
> recently viewed rail reuse, 8 featured products, desktop favorite affordance, linked
> trust strip, empty fallbacks, crop/focal-point hardening, newsletter microcopy,
> hero video pause/data-saver behavior, `sameAs` JSON-LD, and material fallback hardening.
> Still blocked: real social proof/press claims, legal business identifiers, real
> promotion/discount copy, and external Rich Results/Core Web Vitals/manual screen-reader
> validation.
> Scope: the storefront homepage (`src/app/page.tsx`) and the shared components it renders
> (`SiteHeader`, `HomeHeroVideo`, `ProductCard`, `HomeCategoryCard`, `NewsletterForm`,
> `SiteFooter`, `DeferredFixedBackgroundBand`, `reveal.*`).
> Each item lists **Impact** (High / Med / Low), **Effort** (S / M / L), and **Risk**
> (shared-component blast radius). Owner-data items are flagged 🔒.

---

## 0. Legend & ground rules

- **Impact**: expected lift on conversion / trust / a11y / perf / SEO.
- **Effort**: S ≈ <1h, M ≈ half-day, L ≈ multi-day.
- **Risk**: ⚠️ = touches a component shared with other pages; scope or feature-flag it.
- Do **not** invent legal entities, registration numbers, materials, discounts, warranties,
  shipping promises, reviews, ratings, or certifications. Missing facts → hide the field.
- Preserve Hebrew-first RTL and the existing design-token system in `globals.css`.

---

## 1. Conversion & commerce UX

| #   | Item                                                                                                                        | Impact | Effort | Risk           |
| --- | --------------------------------------------------------------------------------------------------------------------------- | ------ | ------ | -------------- |
| 1.1 | **Add a secondary hero CTA** (e.g. "מתנות" / "חדש בקולקציה") next to the primary, for users not ready to browse everything. | High   | S      | —              |
| 1.2 | **Sticky/condensed header CTA on scroll** ("לקנייה"/"חיפוש") so the path forward is always present on long scroll.          | High   | M      | ⚠️ header      |
| 1.3 | **Social proof band** (press logos / "X happy customers") — ONLY if real, owner-provided. 🔒                                | High   | M      | —              |
| 1.4 | **Gift finder entry point** on the homepage (price/occasion quick filters → `/gifts`).                                      | Med    | M      | —              |
| 1.5 | **"Recently viewed" rail** for returning visitors (localStorage-backed, already exists on PDP).                             | Med    | M      | ⚠️ shared rail |
| 1.6 | **Featured products: show 8 instead of 4** on desktop with a "load more"/link, denser discovery.                            | Med    | S      | —              |
| 1.7 | **Quick-add or wishlist affordance** on hover for desktop product cards (keep mobile clean).                                | Med    | M      | ⚠️ ProductCard |
| 1.8 | **Trust strip → link each item** to its policy page (shipping, returns, service) for credibility + internal linking.        | Med    | S      | —              |
| 1.9 | **Newsletter incentive** — only if a real perk exists (early access already stated). Avoid fake discounts. 🔒               | Low    | S      | —              |

## 2. Visual design & hierarchy

| #   | Item                                                                                                                                           | Impact | Effort | Risk           |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ | -------------- |
| 2.1 | **Hero text legibility audit** across all hero video frames — verify scrim contrast on bright frames at every breakpoint.                      | High   | S      | —              |
| 2.2 | **Section rhythm pass** — unify vertical spacing tokens between collections / featured / materials / story so cadence feels intentional.       | Med    | M      | —              |
| 2.3 | **Category cards: consistent aspect ratio + art-directed crops** so the 4 tiles read as a set.                                                 | Med    | M      | —              |
| 2.4 | **Featured card image focal points** — extend `PRODUCT_CARD_IMAGE_POSITION_BY_SOURCE` so no product is awkwardly cropped.                      | Med    | S      | ⚠️ ProductCard |
| 2.5 | **Story band balance** — tighten the two-image editorial layout on tablet (currently optimized for desktop/mobile).                            | Med    | M      | —              |
| 2.6 | **Empty-state polish** — graceful fallback if featured/categories are empty (currently the section is hidden; consider an editorial fallback). | Low    | S      | —              |
| 2.7 | **Badge system audit** — ensure "חדש / מתנה / כסף 925 / ציפוי זהב" never stack awkwardly; cap to one.                                          | Low    | S      | ⚠️ ProductCard |
| 2.8 | **Hover/focus motion consistency** — align card, CTA, and category-tile transitions to the same easing tokens.                                 | Low    | S      | —              |

## 3. Copywriting & messaging (Hebrew-first)

| #   | Item                                                                                                                 | Impact | Effort | Risk              |
| --- | -------------------------------------------------------------------------------------------------------------------- | ------ | ------ | ----------------- |
| 3.1 | **Hero statement A/B variants** — test "תכשיטים שנבחרו לחיים, לא רק לרגע" vs. a benefit-led line.                    | Med    | S      | —                 |
| 3.2 | **Bilingual eyebrow consistency** — decide a rule (English eyebrow + Hebrew title) and document it; apply uniformly. | Med    | S      | —                 |
| 3.3 | **Category descriptions** — verify each reads as boutique copy, not template filler.                                 | Low    | S      | —                 |
| 3.4 | **CTA verb audit** — ensure every CTA is a short action ("לגלות", "לקנות", "לייעוץ"); remove vague ones.             | Low    | S      | —                 |
| 3.5 | **Microcopy for newsletter success/error states** — warm, on-brand, accessible.                                      | Low    | S      | ⚠️ NewsletterForm |

## 4. Accessibility (target: WCAG 2.2 AA)

| #   | Item                                                                                                                        | Impact | Effort | Risk             |
| --- | --------------------------------------------------------------------------------------------------------------------------- | ------ | ------ | ---------------- |
| 4.1 | **Full keyboard pass** — tab through hero → header → cards → footer; verify focus order and visible focus rings everywhere. | High   | M      | —                |
| 4.2 | **Heading-order audit** — confirm exactly one H1 and no skipped levels across all homepage sections.                        | High   | S      | —                |
| 4.3 | **Hero video controls** — provide a visible pause control (beyond reduced-motion auto-pause) for WCAG 2.2.2.                | Med    | M      | ⚠️ HomeHeroVideo |
| 4.4 | **Color-contrast verification** — muted-foreground text on glass surfaces at small sizes.                                   | Med    | S      | —                |
| 4.5 | **Category card alt strategy** — confirm decorative `alt=""` vs. meaningful alt is correct per card.                        | Med    | S      | —                |
| 4.6 | **Screen-reader walkthrough** (NVDA/VoiceOver) — verify no duplicated/again-stuttered names on cards.                       | Med    | M      | —                |
| 4.7 | **Touch target audit at 320–390px** — all CTAs/links ≥ 44×44px.                                                             | Med    | S      | —                |
| 4.8 | **Reduced-motion coverage** — confirm reveal animations + fixed band all respect the preference.                            | Low    | S      | —                |

## 5. Performance (Core Web Vitals)

| #   | Item                                                                                                                     | Impact | Effort | Risk             |
| --- | ------------------------------------------------------------------------------------------------------------------------ | ------ | ------ | ---------------- |
| 5.1 | **Measure real LCP/CLS/INP** with Lighthouse + field data; set a budget per breakpoint.                                  | High   | M      | —                |
| 5.2 | **Hero video weight** — verify webm/mp4 sizes; consider a lighter poster-only experience on slow connections / saveData. | High   | M      | ⚠️ HomeHeroVideo |
| 5.3 | **Image `sizes` precision** — re-audit every responsive `sizes` string against actual rendered widths.                   | Med    | S      | ⚠️ ProductCard   |
| 5.4 | **Defer non-critical client JS** — confirm reveal/observer code is minimal; avoid hydrating static sections.             | Med    | M      | —                |
| 5.5 | **Font loading** — verify `next/font` display strategy avoids layout shift on the Hebrew + display fonts.                | Med    | S      | ⚠️ layout        |
| 5.6 | **Preload audit** — confirm only the hero poster is preloaded; nothing below-the-fold.                                   | Low    | S      | —                |
| 5.7 | **Bundle check** — ensure `lucide-react` / `react-icons` are tree-shaken on the homepage.                                | Low    | S      | —                |

## 6. SEO & metadata

| #   | Item                                                                                                                                     | Impact | Effort | Risk |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ | ---- |
| 6.1 | **Validate Organization + WebSite JSON-LD** (added previously) in Google Rich Results; add `sameAs` socials (real URLs exist in footer). | Med    | S      | —    |
| 6.2 | **OG/Twitter image** — verify the share image renders well at 1200×630; consider a dedicated OG asset.                                   | Med    | S      | —    |
| 6.3 | **Internal linking** — ensure homepage links to all top categories + key policy/gift pages with descriptive anchors.                     | Med    | S      | —    |
| 6.4 | **H1 keyword clarity** — confirm the H1/title communicates "תכשיטים" for search intent.                                                  | Low    | S      | —    |
| 6.5 | **`BreadcrumbList` / `ItemList`** structured data for the featured grid — only if accurate.                                              | Low    | M      | —    |

## 7. Responsiveness (320 / 360 / 390 / 768 / 1024 / 1280 / 1440)

| #   | Item                                                                                                 | Impact | Effort | Risk      |
| --- | ---------------------------------------------------------------------------------------------------- | ------ | ------ | --------- |
| 7.1 | **Device-matrix QA** — capture screenshots at each width; log any overflow/clipping/cramping.        | High   | M      | —         |
| 7.2 | **Hero text sizing on 320px** — ensure title doesn't overflow or wrap awkwardly.                     | High   | S      | —         |
| 7.3 | **Tablet (768/1024) grid tuning** — categories (4-up) and featured (4-up) breakpoints feel balanced. | Med    | S      | —         |
| 7.4 | **Footer accordion behavior on mobile** — verify `<details>` open/close + tap targets.               | Med    | S      | ⚠️ footer |
| 7.5 | **Landscape / short-viewport** hero height (`svh`) sanity check.                                     | Low    | S      | —         |

## 8. Technical quality & resilience

| #   | Item                                                                                                                                              | Impact | Effort | Risk             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ | ---------------- |
| 8.1 | **Harden `getPublicMaterialName`** at the source to return `undefined` (not the legal placeholder) and update callers, so no surface can leak it. | High   | M      | ⚠️ PDP + catalog |
| 8.2 | **DB-down resilience** — confirm the homepage degrades to fixtures cleanly (already prerenders static); add a test.                               | Med    | S      | —                |
| 8.3 | **Console/hydration sweep** — run the homepage and assert zero console errors/hydration mismatches in CI smoke.                                   | Med    | M      | —                |
| 8.4 | **Visual regression snapshots** (Playwright) for the homepage at key widths.                                                                      | Med    | L      | —                |
| 8.5 | **Dead-code/import audit** on `page.tsx` and homepage components.                                                                                 | Low    | S      | —                |

## 9. Owner-required factual data 🔒 (blockers, cannot invent)

- [ ] **Legal business name + ע.מ/ח.פ registration number** → `footerBusinessDetails` in `src/lib/legal-content.ts` (currently hidden behind a guard).
- [ ] Any **press/social-proof claims** before adding a social-proof band (1.3).
- [ ] Any **real promotion/discount** before any sale-driven homepage messaging.
- [ ] Confirmed **shipping/returns/warranty** phrasing if surfaced on the homepage trust strip.

---

## 10. Suggested sequencing

1. **Quick wins (S, low risk):** 1.1, 1.8, 4.2, 4.7, 5.6, 6.1–6.4, 7.2, 8.5.
2. **Measure first:** 5.1, 7.1 (establish CWV + device baselines before bigger changes).
3. **Mid effort, high impact:** 1.2, 4.1, 4.3, 5.2, 8.1.
4. **Larger investments:** 1.3 (pending data), 8.4 visual regression, 2.x design rhythm pass.
5. **Unblock owner data (Section 9)** in parallel — several items depend on it.
