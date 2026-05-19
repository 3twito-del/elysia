# High Jewelry Reference Gate

Status: required gate for future public Aphrodite design, UX, content, and
structure changes.

Implementation marker: `HIGH_JEWELRY_REFERENCE_GATE`.

## Purpose

This gate prevents public UI or content changes from being implemented only
because they were requested locally. Every future public-facing change must be
checked against a fixed high-jewelry reference set before code is edited.

Rule: unsupported means no implementation until explicit exception. If a
requested change does not pass the weighted gate, Codex must say that it is not
supported by the High Jewelry Reference Gate, cite the score and reason, and
stop before editing files. Implementation may continue only after the user
explicitly approves an exception, and that exception must be recorded.

## Reference Corpus

The gate uses 15 Tier A high jewelry sites. Each keeps the existing Tier A
weight of `1.5`, for a total weight of `22.5`. The pass threshold is `11.25`,
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
3. Compare the requested change against the relevant screens in the 15-site
   gate. Use the broad 30-site corpus only as secondary commerce usability
   context; this high-jewelry gate wins for luxury, content, and design tone.
4. Record support as site names plus evidence URLs, then calculate the weighted
   score. Score at least `11.25` means supported and implementable.
5. If the score is below `11.25`, mark the request as unsupported and do not
   edit code. The user may approve an explicit exception; if so, record the
   exception and implement with the exception called out.
6. Mandatory legal, accessibility, payment, SEO, cookie, and backend-correctness
   changes may pass as mandatory exceptions, but the exception must still be
   explicit.

## Example

For an About copy reduction, compare Aphrodite against Maison, About, heritage,
and story pages in the 15-site corpus. If at least 8 sites support shorter,
more restrained content density, the change can proceed. If not, Codex must
state that the About copy reduction is unsupported by the gate and wait for an
explicit exception before editing.
