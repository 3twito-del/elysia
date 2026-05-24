# Coherence Final Prompt

You are working in the Elysia repository. Finish a coherence-preserving
production release without changing public URLs, API shapes, tRPC contracts,
Prisma schema, environment variable names, or public UX text.

Follow `docs/ENGINEERING_CONVENTIONS.md` as the contract:

- Keep business logic in `src/server/services`.
- Keep external provider and SDK wrapping in `src/server/adapters`.
- Keep route handlers and tRPC routers as I/O coordinators that validate, rate
  limit, call services, and return the existing public shape.
- Keep public import paths stable through facades or re-exports when code is
  split.
- Move implementation weight into focused sibling modules such as
  `*-inputs`, `*-contract`, `*-assets`, `*-types`, `_lib`, and leaf
  `_components`.
- Do not introduce unapproved debt markers, direct DB imports in routes, UI
  imports in services, adapter transactions, or new files above the coherence
  size threshold unless the exception is explicit in
  `scripts/coherence-contract.mjs`.

Execution order:

1. Inspect `git status --short` and preserve unrelated user changes.
2. Run `node scripts/coherence-contract.mjs`.
3. If the contract fails, fix boundaries with internal refactors only. Do not
   change public behavior unless a regression test proves an existing bug.
4. Run focused tests for changed modules.
5. Run `pnpm gate:coherence`.
6. Run `pnpm gate:ship`. Do not substitute `gate:full`; it is reserved for
   manual high-risk releases because it includes live public benchmarks.
7. Run `git diff --check` and inspect `git status --short`.
8. If a gate rewrites generated QA markdown with trailing blank lines, clean
   only `docs/qa/*.md`.
9. Confirm the linked Vercel project is `elysia`. If the Vercel CLI is not
   authenticated, stop and request authentication or a token.
10. Deploy production with:

```powershell
vercel pull --yes --environment=production
vercel build --prod
vercel deploy --prebuilt --prod
```

11. Smoke the returned production URL with the core public routes and record the
    final URL.

Completion criteria:

- `pnpm gate:coherence` passes.
- `pnpm gate:ship` passes.
- `git diff --check` is clean.
- Production deploy completes through the linked Vercel project.
- The final response reports the deploy URL, smoke result, and any remaining
  documented coherence exceptions.
