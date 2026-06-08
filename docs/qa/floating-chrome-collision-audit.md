# Floating Chrome Collision Audit

Generated: 2026-05-31

Status: passed baseline audit for public floating chrome.

This audit covers cookie consent, accessibility controls, mobile navigation,
category filter sheets, and sticky public chrome behavior at the current
baseline. It records verification evidence for
the historical task item `I-002`, now consolidated under
`docs/PROJECT_TASKS.md`.

## Evidence

| Check                                   | Command or method                                                                                                                                       | Result                                                                                                                                    |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Static floating chrome contract         | `pnpm test -- src/styles/floating-chrome-contract.test.ts`                                                                                              | PASS: 7 tests passed.                                                                                                                     |
| Dev server browser smoke                | `agent-browser open http://localhost:3000/` plus content, overlay, console, and snapshot checks                                                         | PASS: page has content, no Next.js error overlay, no console errors.                                                                      |
| Route visual QA                         | `scripts/visual-qa-agent-browser.ps1` against `/`, `/product/venus-line-ring`, `/checkout`, and `/category/earrings` across desktop, tablet, and mobile | PASS: 12 route/viewport checks, no blank content, no error overlay, no horizontal overflow, no broken images.                             |
| Cookie banner and accessibility trigger | Mobile browser geometry check on `/`                                                                                                                    | PASS: cookie banner and accessibility trigger are both visible and do not overlap.                                                        |
| Mobile navigation sheet                 | Mobile browser interaction on `/`                                                                                                                       | PASS: sheet is visible, `data-public-overlay-open` is set, accessibility trigger is hidden by opacity, and no horizontal overflow exists. |
| Category filter sheet                   | Mobile browser interaction on `/category/earrings`                                                                                                      | PASS: sheet is visible, `data-public-overlay-open` is set, accessibility trigger is hidden by opacity, and no horizontal overflow exists. |
| Accessibility dialog                    | Mobile browser interaction on `/category/earrings`                                                                                                      | PASS: dialog is visible, focus lands inside the dialog, and no horizontal overflow exists.                                                |

Local artifacts:

- `artifacts/qa/2026-05-31-floating-chrome-audit/agent-browser-visual-qa.json`
- `artifacts/qa/2026-05-31-floating-chrome-audit/agent-browser-screenshots/desktop-home.png`

The artifact directory is intentionally ignored by git.

## Current Conclusion

No code change is required for the current baseline. The existing CSS contract,
public motion provider, cookie banner offset, accessibility trigger offset, and
sheet overlay behavior are coherent for the audited route set.

## Remaining Risk

- This audit is a baseline sample, not an exhaustive interaction crawl.
- Re-run visual QA when public sheets, dialogs, sticky checkout controls,
  cookie placement, or accessibility trigger placement changes.
- For checkout or product sticky-bar edits, include a route-specific mobile
  interaction pass in addition to the static contract test.
