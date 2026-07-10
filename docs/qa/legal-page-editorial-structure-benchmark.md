# Legal Page Editorial Structure Benchmark

- `Date`: 2026-07-10
- `Backlog Item`: I-330 / J-07 Legal-page editorial usability
- `Status`: Not supported — no implementation

## Scope

This benchmark covers the long-form legal/policy pages shared across `/terms`,
`/privacy`, `/warranty`, `/shipping-returns`, and `/accessibility`, all built on
`src/components/content-page-shell.tsx` and
`src/components/legal-section-list.tsx`. The Elysia baseline was confirmed by
reading source directly before any external research:

- `src/components/content-page-shell.tsx` renders the table-of-contents `nav`
  with `hidden lg:sticky lg:top-24 lg:grid` — the ToC does not render at all
  below the `lg` breakpoint (~1024px+), so mobile visitors get zero in-page
  jump navigation.
- `src/components/legal-section-list.tsx` renders every section as an icon +
  `h2` + a single full paragraph of legal text. There is no short
  summary/plain-language abstract anywhere in the shared component, on desktop
  or mobile.
- `src/app/terms/page.tsx` currently has 19 sections using this shared list,
  so a mobile reader must linearly scroll the entire document with no way to
  jump to a specific clause.
- Elysia's site-wide print stylesheet (`src/styles/globals.css`, `@media
  print` block) already hides header/footer/floating chrome for printed
  legal pages, so print handling was explicitly excluded from this research.

This research checked whether Tier-A high-jewelry sites give their own
long-form legal/policy pages (1) any in-page navigation that would still work
on a narrow mobile viewport, and (2) any short summary or "in brief" callout
near/above the full legal text. Only real fetched evidence is recorded below;
no site's markup was guessed or inferred from memory.

## Gate Classification

- `Change Type`: Legal/policy page mobile navigation and summary treatment.
- `Route Context`: legal.
- `Primary Lens`: High Jewelry Reference Gate in docs/DESIGN.md.
- `Required Gate`: Tier A high-jewelry threshold 11.25 (weight 1.5 per site,
  need support from >=8 of 15 sites).

## Benchmark Evidence

| Site | Evidence URL | Observed Pattern | Weight |
| --- | --- | --- | --- |
| Cartier | https://www.cartier.com/en-us/legal/terms-of-use.html | No in-page ToC, jump links, sidebar, or accordion — plain headings in a single linear column. Document opens directly into legal text ("Last updated: September 2025") with no summary or "in brief" callout. | 1.5 |
| Repossi | https://intl.repossi.com/en-us/pages/terms-and-conditions | No in-page ToC or jump links; section headers are plain text with no anchors. No accordion/collapsible sections, no sidebar, no summary above the full legal text. | 1.5 |
| Garrard | https://www.garrard.com/en-us/pages/terms-conditions | Only navigation aid is a generic "Skip to content" link, not a document ToC. Numbered headings (1-13) are plain text with no anchor links, no accordions, no summary/key-points box. | 1.5 |
| Vhernier | https://www.vhernier.com/en-us/pages/terms-of-use | No table of contents or jump links; standard h1-h3 heading hierarchy with linear, non-collapsible sections. No "in brief" summary near the opening statement. | 1.5 |
| Verdura | https://verdura.com/pages/terms-conditions | No in-page ToC/jump links; 25 numbered sections presented sequentially with no accordion or sidebar (notably, sections 12-14 are erroneously duplicated as 23-25, underscoring how little structural tooling is applied). No summary callout — document opens straight into "OVERVIEW" full text. | 1.5 |
| Chopard | https://www.chopard.com/en-us/legal-terms-of-sale.html | 15 numbered sections with plain-text headers, no anchor-linked ToC, no sidebar, no accordion in the legal body itself. No "in brief" summary — opens with "Please read the following information carefully before using the site." | 1.5 |
| Suzanne Kalan | https://suzannekalan.com/pages/terms-conditions | No table of contents or jump links; 20 numbered sections (h4 headings) presented in full, linear, non-collapsible form. No summary/executive-overview callout. | 1.5 |
| Anna Sheffield | https://www.annasheffield.com/pages/store-policies | The one exception found: policy content (returns, ring size/fit, jewelry care, warranties/repairs, shipping, product quality, international orders) is organized as accordion/dropdown sections by topic, which is inherently mobile-collapsible even though it is not a jump-to-anchor ToC. Still no short summary/"in brief" text above the full policy detail — headers expand directly into dense full text. | 1.5 |
| Jessica McCormack | https://www.jessicamccormack.com/legal/terms-conditions | No in-page ToC or jump links; numbered Terms of Use sections plus a separate numbered Acceptable Use Policy, no accordion, no sidebar adjacent to the legal content. No summary callout. | 1.5 |
| Mikimoto | https://www.mikimotoamerica.com/us_en/terms-and-privacy | No ToC or jump links; sections marked only by bold headers and horizontal rules (Terms of Website Use, Sales, IP Rights, Privacy Policy, etc., all on one long page). No accordion, no summary before the full legal text. | 1.5 |
| Messika | https://www.messika.com/us_en/terms-of-sale | Only navigational aid is a generic "Skip to content" link and a breadcrumb; the 12 numbered sections themselves have no anchors, accordion, or sidebar. No summary/"in brief" section separate from the full legal text. | 1.5 |
| De Beers | https://www.debeers.com/en-us/terms-and-conditions.html | No ToC or jump links; 18 numbered sections with decimal subsections and all-caps legal warning blocks ("THIS DOCUMENT CONTAINS VERY IMPORTANT INFORMATION..."). No sidebar or accordion. No summary — the all-caps warning block substitutes for one but is legal boilerplate, not a plain-language recap. | 1.5 |
| Pomellato | https://www.pomellato.com/en_us/corporate/legal-area/terms-and-conditions-of-sale | No ToC or jump links; 18 numbered sections with decimal subsections, an all-caps warning block, and a plain HTML delivery-options table further down. No sidebar or accordion in the legal body, no summary callout. | 1.5 |
| Roberto Coin | https://robertocoin.com/pages/terms-of-use | No ToC or jump links beyond a generic "Skip to content" anchor. Content is a single ~17-item bulleted list under one heading ("Your Use of the Website") with no subsection breaks, accordion, or sidebar. No summary text before the full terms. | 1.5 |

## Sites Not Verified

- **Buccellati** — every legal-page URL found (`/en_us/termini-utilizzo`,
  `/en_us/conditions-of-sale`, `/en_us/privacy-policy`) returned HTTP 405
  Method Not Allowed to the fetch tool on repeated attempts. The domain
  appears to block this access pattern outright for these routes, so no real
  markup evidence could be captured. Not counted toward the benchmark table.

## Preliminary Read

Across all 14 verifiable sites, the pattern is unambiguous and consistent:
**none** provide a genuine in-page table of contents or jump-link navigation
for their legal/policy documents, and **none** provide a short summary,
"in brief" callout, or plain-language recap separate from the full legal
text — every single page opens directly into full legal prose (sometimes
prefaced by an all-caps arbitration/liability warning, which is the opposite
of a plain-language summary). The one partial exception is Anna Sheffield's
store-policies page, which groups its (non-ToS) policy content into
accordion/dropdown sections — a pattern that is inherently mobile-friendly
and collapsible, but it still does not summarize content before the full
text, and it is not a jump-to-anchor ToC like Elysia's desktop sidebar.

Taken at face value, this raw pattern argues that neither "mobile in-page ToC
for long legal text" nor "short summaries alongside full legal text" is an
established Tier-A high-jewelry convention — if anything, Elysia's existing
desktop-only sidebar ToC in `content-page-shell.tsx` is already a more
sophisticated navigation aid than what most of these reference sites offer at
any viewport width.

## Score

- `Supported Sites`: 0 of 15. No verified site provides a mobile-capable
  in-page jump-to-anchor ToC or a short summary/"in brief" callout separate
  from the full legal text. Anna Sheffield's accordion-grouped policy page is
  the closest partial match but does not meet either criterion as scoped
  (it is not a jump-link ToC, and it does not summarize before the full text)
  and is not counted as support.
- `Weighted Score`: 0.0.
- `Threshold`: 11.25.
- `Decision`: **Not supported.** Per `docs/DESIGN.md` Part I: "unsupported
  means no implementation until explicit exception." No code change is made
  from this research. If a future proposal narrows the scope (e.g., matching
  Anna Sheffield's accordion pattern specifically, rather than a jump-link
  ToC plus summaries) it would need its own benchmark pass — this evidence
  does not transfer to a differently-scoped change.

## Implementation Decision

None. This is a negative result, recorded so the identical question is not
re-researched without new evidence or a narrower proposal.
