# QA Benchmark Traceability

- `Backlog Item`: I-199 Benchmark Traceability
- `Status`: Implemented as a source-level traceability check

## Rule

QA benchmark documents may reference a backlog ID only when the ID is either
present in the current multi-aspect backlog or intentionally listed as a
historical benchmark ID in the traceability test.

## Historical IDs

The first QA benchmark pass used IDs `I-003` through `I-047`. Those IDs remain
valid historical references for benchmark documents whose purpose is preserving
evidence from that earlier pass. New benchmark documents should use a current
backlog ID unless the document explicitly preserves historical evidence.

## Check

Run:

```powershell
pnpm test -- src/styles/qa-benchmark-traceability.test.ts
```
