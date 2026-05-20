# Public Benchmark Index

Generated: 2026-05-20T00:14:01.763Z

## Latest Results

| Part             | Status | Alignment | Active Corpus | Substitutions                                                                                                                                 | Report                                             |
| ---------------- | ------ | --------: | ------------: | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Header           | pass   |      100% |         12/12 | Cartier -> David Yurman; Tiffany & Co. -> Mejuri; Bulgari -> Aurate; Harry Winston -> Kendra Scott                                            | [report](./header-benchmark/benchmark.md)          |
| Footer           | pass   |      100% |         14/14 | Cartier -> David Yurman; Tiffany & Co. -> Mejuri; Bulgari -> Brilliant Earth; Harry Winston -> VRAI; Chaumet -> Aurate                        | [report](./footer-benchmark/benchmark.md)          |
| Floating Chrome  | warn   |       66% |         15/15 | Cartier -> David Yurman; Tiffany & Co. -> Mejuri; Bulgari -> Brilliant Earth; Harry Winston -> Blue Nile; Chaumet -> VRAI; Mikimoto -> Aurate | [report](./floating-chrome-benchmark/benchmark.md) |
| Route Hero       | warn   |       61% |         14/14 | Cartier -> David Yurman; Tiffany & Co. -> Mejuri; Bulgari -> Brilliant Earth; Harry Winston -> Blue Nile; Chaumet -> Kendra Scott             | [report](./route-hero-benchmark/benchmark.md)      |
| PLP Search Gifts | warn   |       71% |         15/15 | Cartier -> David Yurman; Tiffany & Co. -> Mejuri; Bulgari -> Brilliant Earth; Harry Winston -> Blue Nile; Chaumet -> VRAI; Mikimoto -> Aurate | [report](./plp-benchmark/benchmark.md)             |
| Product Card     | warn   |       57% |         15/15 | Cartier -> David Yurman; Tiffany & Co. -> Mejuri; Bulgari -> Brilliant Earth; Harry Winston -> Blue Nile; Chaumet -> VRAI; Mikimoto -> Aurate | [report](./product-card-benchmark/benchmark.md)    |
| PDP              | warn   |       77% |         15/15 | Cartier -> David Yurman; Tiffany & Co. -> Mejuri; Bulgari -> Brilliant Earth; Harry Winston -> Blue Nile; Chaumet -> VRAI; Mikimoto -> Aurate | [report](./pdp-benchmark/benchmark.md)             |
| Checkout         | warn   |       77% |         15/15 | Cartier -> David Yurman; Tiffany & Co. -> Mejuri; Bulgari -> Brilliant Earth; Harry Winston -> Blue Nile; Chaumet -> VRAI; Mikimoto -> Aurate | [report](./checkout-benchmark/benchmark.md)        |
| Service Account  | pass   |       89% |         15/15 | Cartier -> David Yurman; Tiffany & Co. -> Mejuri; Bulgari -> Brilliant Earth; Harry Winston -> Blue Nile; Chaumet -> VRAI; Mikimoto -> Aurate | [report](./service-account-benchmark/benchmark.md) |
| Content Legal    | warn   |       79% |         15/15 | Cartier -> David Yurman; Tiffany & Co. -> Mejuri; Bulgari -> Brilliant Earth; Harry Winston -> Blue Nile; Chaumet -> VRAI; Mikimoto -> Aurate | [report](./content-legal-benchmark/benchmark.md)   |
| AI Stylist       | warn   |       75% |         15/15 | Cartier -> David Yurman; Tiffany & Co. -> Mejuri; Bulgari -> Brilliant Earth; Harry Winston -> Blue Nile; Chaumet -> VRAI; Mikimoto -> Aurate | [report](./ai-stylist-benchmark/benchmark.md)      |

## Cross-Surface Lessons

- Treat live-site failures as evidence-quality signals, not automatic Elysia failures.
- Use recommendations as candidates for the Public Change Gate; do not implement public UI changes directly from benchmark output.
- Re-run local benchmarks before UI work and live benchmarks before changing gate policy.

## Implementation Recommendations By Priority

1. Prioritize repeated mismatches that appear across header, listing, PDP, and checkout surfaces.
2. Route any public UI adjustment through `docs/PUBLIC_CHANGE_GATE.md` before implementation.
3. Re-run the affected benchmark locally after design changes, then run live reference crawling before changing policy.
