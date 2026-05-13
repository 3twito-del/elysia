# Roadmap Visual QA Evidence

This directory contains curated screenshots used as design and regression evidence
for the no-blocker upgrade roadmap.

## Files

- `hero-left-actions.png`, `hero-absolute-left-actions.png`,
  `hero-equal-offsets.png`: home hero alignment explorations.
- `hero-unified-offsets.png`: current home hero desktop alignment evidence,
  with matched inline and block offsets.
- `home-hero-roadmap.png`: current home hero desktop regression evidence.
- `mobile-nav-sheet-roadmap.png`: mobile navigation sheet open state.
- `category-filter-sheet-roadmap.png`: mobile category filter sheet open state.
- `category-filter-panel-roadmap.png`: desktop category filter panel and results
  context.
- `accessibility-popup-roadmap.png`: representative key popup/dialog surface.
- `product-card-roadmap.png`: product-card spacing, image ratio, and metadata
  review.
- `search-no-results-roadmap.png`: search empty-state recovery review.
- `checkout-validation-roadmap.png`: checkout validation and summary review.

Generated Playwright runtime output belongs in `test-results/` and is ignored.
Only curated screenshots with human review value should be kept here.

Refresh the current roadmap screenshot set with a local dev server running:

```bash
node scripts/capture-roadmap-visuals.mjs
```

Use `ROADMAP_BASE_URL` to capture against a different URL.
