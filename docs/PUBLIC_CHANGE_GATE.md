# Public Change Gate

Status: single source of truth for future public Aphrodite design, UX,
content, structure, and commerce-control changes.

Implementation markers retained in code:

- `HIGH_JEWELRY_REFERENCE_GATE`
- `PUBLIC_STRUCTURE_BENCHMARK_V4`

## Purpose

This gate prevents public-facing changes from being implemented only because
they were requested locally. Every future public UI, UX, content, structure, or
commerce-control change must be checked before code is edited.

Rule: unsupported means no implementation until explicit exception. If a
requested change does not pass the weighted gate, Codex must say that it is not
supported by the High Jewelry Reference Gate, cite the score and reason, and
stop before editing files. Implementation may continue only after the user
explicitly approves an exception, and that exception must be recorded in the
work summary or follow-up change note.

## High Jewelry Reference Gate

The Tier A-only high jewelry gate uses 15 Tier A high jewelry sites. Each site
has weight `1.5`, for a total weight of `22.5`. The pass threshold is `11.25`,
which requires support from at least 8 of 15 sites.

| Site | Source URL | Weight |
| --- | --- | --- |
| Cartier | https://www.cartier.com/en-us/jewelry/ | 1.5 |
| Tiffany & Co. | https://www.tiffany.com/ | 1.5 |
| Van Cleef & Arpels | https://www.vancleefarpels.com/us/en/collections/jewelry/couture.html | 1.5 |
| Bulgari | https://www.bulgari.com/en-us/ | 1.5 |
| Harry Winston | https://www.harrywinston.com/ | 1.5 |
| Graff | https://www.graff.com/us-en/home/ | 1.5 |
| Chopard | https://www.chopard.com/en-us | 1.5 |
| Boucheron | https://www.boucheron.com/us/ | 1.5 |
| Chaumet | https://www.chaumet.com/us_en/ | 1.5 |
| Piaget | https://www.piaget.com/us-en | 1.5 |
| Mikimoto | https://www.mikimoto.com/en/index.html | 1.5 |
| Messika | https://www.messika.com/us_en/ | 1.5 |
| Buccellati | https://www.buccellati.com/en_us/home | 1.5 |
| De Beers | https://www.debeers.com/en-us/home | 1.5 |
| Pomellato | https://www.pomellato.com/ | 1.5 |

## Required Workflow

1. Classify the request as public design, UX, content, structure, or commerce
   control. Admin-only and internal technical changes are outside this gate
   unless they affect the public UI.
2. Map the request to the closest route context: home, PLP/search/gifts, PDP,
   checkout, service, account, content, legal, or global UI.
3. Compare the requested change against relevant screens in the 15-site gate.
   Use the broad 30-site public benchmark corpus only as secondary commerce
   usability context; the high-jewelry gate wins for luxury, content, and
   design-tone decisions.
4. Record support as site names plus evidence URLs, then calculate the weighted
   score. A score of at least `11.25` means supported and implementable.
5. If the score is below `11.25`, mark the request as unsupported and do not
   edit code. The user may approve an explicit exception; if so, record the
   exception and implement with the exception called out.
6. Mandatory legal, accessibility, payment, SEO, cookie, and backend-correctness
   changes may pass as mandatory exceptions, but the exception must still be
   explicit.

Example: for an About copy reduction, compare Aphrodite against Maison, About,
heritage, and story pages in the 15-site corpus. If at least 8 sites support
shorter, more restrained content density, the change can proceed. If not,
Codex must state that the About copy reduction is unsupported by the gate and
wait for an explicit exception before editing.

## Public Structure Policy

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

## Historical Decisions

Historical gate decisions are folded into this document and the enforcing code:

- `DCH-023`: Public benchmark corpus v3 established the fixed global commerce
  benchmark as secondary evidence.
- `DCH-032`: Public structure benchmark v4 established structural route
  archetypes for public pages.
- `DCH-041`: High jewelry reference gate requires all future public UI, UX,
  content, structure, and commerce-control changes to pass
  `HIGH_JEWELRY_REFERENCE_GATE` unless a mandatory or explicit user-approved
  exception is recorded.

## Verification Chain

Before shipping a public change:

1. Apply this gate before editing code.
2. Implement only the supported or explicitly excepted change.
3. Run `pnpm check`.
4. Run `pnpm build`.
5. Run `pnpm e2e` for public UI, commerce flow, responsive, accessibility, or
   route-structure changes.
6. Push only after local verification passes, then require the GitHub `Quality`
   workflow and Vercel deployment to complete successfully.
