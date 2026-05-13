# Responsive Layout Audit

Audit date: 2026-05-13

Command:

```bash
pnpm responsive:audit
```

## Coverage

- Viewports: mobile `390x844`, tablet `768x1024`, laptop `1366x768`, wide desktop `1920x1080`.
- Public routes: home, search with results, search no-results, category, product, checkout, account, gifts, branches, AI, stylist, about, FAQ, privacy, terms, accessibility.
- Admin route: `/admin/login`.
- Browser state: essential cookie consent set, reduced motion enabled, Next.js dev chrome hidden for measurement.

## Checks

- No document-level horizontal overflow.
- No visible interactive control escapes the viewport horizontally.
- No clipped visible text inside clipping containers.
- No clipped visible content inside clipping interactive controls.
- No Next.js/Vite error overlay.
- Page body contains rendered content.

## Result

Passed for 17 routes across 4 viewports.

No responsive layout regressions were detected for text overflow, clipped controls, or viewport-width overflow in the audited surfaces.
