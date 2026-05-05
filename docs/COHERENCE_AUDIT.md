# Coherence Audit

## Baseline

- `pnpm check` and `pnpm build` pass on the current branch.
- The worktree contains a broad no-blocker upgrade in progress: public commerce
  UX, cookie consent, cart count API, visual QA scripts, smoke/e2e coverage, and
  multiple UI primitive refinements.
- The repository is a Next.js App Router application. Keep data fetching in
  Server Components/services, interactivity in small Client Components, and
  provider SDKs behind lazy adapters.

## Findings

- **Artifacts**: roadmap screenshots were stored at the repository root; they now
  belong under `docs/qa/roadmap/`. `test-results/` is runtime output and should
  not be committed.
- **Formatting duplication**: currency formatting existed in account, admin,
  checkout, manual checkout, order detail, product, catalog, and AI code. The
  source of truth should be `src/lib/format.ts`.
- **Commerce labels**: order status, fulfillment labels, availability labels,
  stock labels, and count labels were spread across route files and product
  cards. They should live in `src/lib/commerce-labels.ts`.
- **UI state patterns**: empty/no-results/error panels were hand-built in each
  page. Shared state components should be used for coherent spacing, icons,
  copy length, and focusable recovery actions.
- **API responses**: route handlers used several local JSON shapes and rate-limit
  response blocks. Shared helpers should standardize `{ ok, error }` responses
  while preserving public response contracts.
- **Encoding/copy**: some tooling displays Hebrew as mojibake when reading older
  files. Keep files UTF-8, avoid unnecessary rewrites, and prefer focused copy
  edits over whole-file churn.

## Follow-up Checks

- Run `pnpm check`, `pnpm build`, `pnpm smoke`, `pnpm e2e`,
  `pnpm visual:qa`, and `pnpm format:check` after coherence refactors.
- Browser-verify core routes after starting a dev server: `/`, `/search`,
  `/category/earrings`, `/product/venus-line-ring`, `/checkout`, `/account`,
  and `/admin`.
