# Public Benchmark Index

Generated: 2026-05-25T20:08:38.101Z

## Latest Results

| Part | Status | Alignment | Active Corpus | Substitutions | Report |
| --- | --- | ---: | ---: | --- | --- |
| Header | pass | 86% | 12/12 | Cartier -> David Yurman; Tiffany & Co. -> Mejuri; Bulgari -> Aurate; Harry Winston -> Kendra Scott | [report](./header-benchmark/benchmark.md) |
| Footer | pass | 85% | 15/15 | Cartier -> David Yurman; Tiffany & Co. -> Mejuri; Bulgari -> Brilliant Earth; Harry Winston -> Blue Nile; Chaumet -> VRAI; Mikimoto -> Aurate | [report](./footer-benchmark/benchmark.md) |
| Floating Chrome | warn | 69% | 15/15 | Cartier -> David Yurman; Tiffany & Co. -> Mejuri; Bulgari -> Brilliant Earth; Harry Winston -> Blue Nile; Chaumet -> VRAI; Mikimoto -> Aurate | [report](./floating-chrome-benchmark/benchmark.md) |
| Route Hero | warn | 64% | 14/14 | Cartier -> David Yurman; Tiffany & Co. -> Mejuri; Bulgari -> Brilliant Earth; Harry Winston -> Blue Nile; Chaumet -> Kendra Scott | [report](./route-hero-benchmark/benchmark.md) |
| PLP Search Gifts | warn | 70% | 15/15 | Cartier -> David Yurman; Tiffany & Co. -> Mejuri; Bulgari -> Brilliant Earth; Harry Winston -> Blue Nile; Chaumet -> VRAI; Mikimoto -> Aurate | [report](./plp-benchmark/benchmark.md) |
| Product Card | warn | 64% | 15/15 | Cartier -> David Yurman; Tiffany & Co. -> Mejuri; Bulgari -> Brilliant Earth; Harry Winston -> Blue Nile; Chaumet -> VRAI; Mikimoto -> Aurate | [report](./product-card-benchmark/benchmark.md) |
| PDP | warn | 80% | 15/15 | Cartier -> David Yurman; Tiffany & Co. -> Mejuri; Bulgari -> Brilliant Earth; Harry Winston -> Blue Nile; Chaumet -> VRAI; Mikimoto -> Aurate | [report](./pdp-benchmark/benchmark.md) |
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
