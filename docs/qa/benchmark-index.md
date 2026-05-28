# Public Benchmark Index

Generated: 2026-05-28T11:35:58.491Z

## Latest Results

| Part | Status | Alignment | Active Corpus | Substitutions | Report |
| --- | --- | ---: | ---: | --- | --- |
| Header | pass | 86% | 12/12 | Cartier -> David Yurman; Tiffany & Co. -> Mejuri; Bulgari -> Aurate; Harry Winston -> Kendra Scott | [report](./header-benchmark/benchmark.md) |
| Footer | pass | 85% | 15/15 | Cartier -> David Yurman; Tiffany & Co. -> Mejuri; Bulgari -> Brilliant Earth; Harry Winston -> Blue Nile; Chaumet -> VRAI; Mikimoto -> Aurate | [report](./footer-benchmark/benchmark.md) |
| Floating Chrome | local-only | 88% | 0/0 | None | [report](./floating-chrome-benchmark/benchmark.md) |
| Route Hero | pass | 95% | 13/13 | Cartier -> David Yurman; Tiffany & Co. -> Mejuri; Bulgari -> Blue Nile; Harry Winston -> Kendra Scott | [report](./route-hero-benchmark/benchmark.md) |
| PLP Search Gifts | pass | 83% | 15/15 | Cartier -> David Yurman; Tiffany & Co. -> Mejuri; Bulgari -> Blue Nile; Harry Winston -> VRAI; Chaumet -> Aurate; Mikimoto -> Kendra Scott | [report](./plp-benchmark/benchmark.md) |
| Search Control | pass | n/a | manual | None | [report](./search-control-benchmark/benchmark.md) |
| Product Card | pass | 81% | 3/3 | Cartier -> Mejuri; Tiffany & Co. -> Aurate | [report](./product-card-benchmark/benchmark.md) |
| PDP | pass | 82% | 15/15 | Cartier -> David Yurman; Tiffany & Co. -> Mejuri; Bulgari -> Blue Nile; Harry Winston -> VRAI; Chaumet -> Aurate; Mikimoto -> Kendra Scott | [report](./pdp-benchmark/benchmark.md) |
| Checkout | pass | 85% | 15/15 | Cartier -> David Yurman; Tiffany & Co. -> Mejuri; Bulgari -> Brilliant Earth; Harry Winston -> Blue Nile; Chaumet -> VRAI; Mikimoto -> Aurate | [report](./checkout-benchmark/benchmark.md) |
| Service Account | pass | 87% | 15/15 | Cartier -> David Yurman; Tiffany & Co. -> Mejuri; Bulgari -> Brilliant Earth; Harry Winston -> Blue Nile; Chaumet -> VRAI; Mikimoto -> Aurate | [report](./service-account-benchmark/benchmark.md) |
| Content Legal | pass | 89% | 15/15 | Cartier -> David Yurman; Tiffany & Co. -> Mejuri; Bulgari -> Brilliant Earth; Harry Winston -> Blue Nile; Chaumet -> VRAI; Mikimoto -> Aurate | [report](./content-legal-benchmark/benchmark.md) |
| AI Stylist | pass | 86% | 15/15 | Cartier -> David Yurman; Tiffany & Co. -> Mejuri; Bulgari -> Brilliant Earth; Harry Winston -> Blue Nile; Chaumet -> VRAI; Mikimoto -> Aurate | [report](./ai-stylist-benchmark/benchmark.md) |

## Cross-Surface Lessons

- Treat live-site failures as evidence-quality signals, not automatic Elysia failures.
- Use recommendations as candidates for the Public Change Gate; do not implement public UI changes directly from benchmark output.
- Re-run local benchmarks before UI work and live benchmarks before changing gate policy.

## Implementation Recommendations By Priority

1. Prioritize repeated mismatches that appear across header, listing, PDP, and checkout surfaces.
2. Route any public UI adjustment through `docs/PUBLIC_CHANGE_GATE.md` before implementation.
3. Re-run the affected benchmark locally after design changes, then run live reference crawling before changing policy.
