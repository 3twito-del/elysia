# QA Benchmark Traceability

- `Backlog Item`: I-199 Benchmark Traceability
- `Status`: Implemented as a source-level traceability check

## Rule

QA benchmark documents may reference a backlog ID only when the ID is either
present in the current multi-aspect backlog or intentionally listed as a
historical benchmark ID in the traceability test.

## Historical IDs

The first QA benchmark pass used IDs `I-003` through `I-047`. Later completed
backlog rotations used IDs `I-101` through `I-200`. Those IDs remain valid
historical references for benchmark documents whose purpose is preserving
evidence from earlier passes. New benchmark documents should use a current
backlog ID unless the document explicitly preserves historical evidence.

## Active Rotation

The current active multi-aspect backlog rotation uses IDs `I-201` through
`I-300`. When that batch is retired, update
`src/styles/qa-benchmark-traceability.test.ts` so those IDs become explicitly
historical before adding the next active rotation.

## Check

Run:

```powershell
pnpm test -- src/styles/qa-benchmark-traceability.test.ts
```
