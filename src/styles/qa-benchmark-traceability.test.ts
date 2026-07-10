import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const historicalBenchmarkBacklogIds = new Set(
  [...Array.from({ length: 302 }, (_, index) => index + 1), 305, 306, 328].map(
    (number) => `I-${String(number).padStart(3, "0")}`,
  ),
);
const activeBacklogRotation = {
  end: 400,
  start: 301,
} as const;

describe("QA benchmark traceability", () => {
  it("keeps benchmark backlog references current or intentionally historical", () => {
    const backlog = read("docs/TASKS.md");
    const activeBacklogIds = new Set(
      Array.from(backlog.matchAll(/\|\s*(I-\d{3})\s*\|/g), (match) => {
        const id = match[1];

        if (!id) throw new Error("Backlog ID capture failed.");

        return id;
      }),
    );
    const activeBacklogNumbers = Array.from(activeBacklogIds, (id) =>
      Number(id.slice(2)),
    );
    const activeBatchIsEmpty = backlog.includes(
      "No active actionable items remain in this review batch.",
    );
    const evidenceLedger = read("docs/QA_EVIDENCE.md");
    const backlogItemLines = evidenceLedger
      .split("\n")
      .filter((line) => line.includes("`Backlog Item`"));
    const offenders = backlogItemLines.flatMap((line) => {
      const ids = Array.from(line.matchAll(/\bI-\d{3}\b/g), (match) => {
        const id = match[0];

        return id;
      });

      if (ids.length === 0) return [`docs/QA_EVIDENCE.md: missing backlog ID`];

      return ids
        .filter(
          (id) =>
            !activeBacklogIds.has(id) && !historicalBenchmarkBacklogIds.has(id),
        )
        .map((id) => `docs/QA_EVIDENCE.md: unknown backlog ID ${id}`);
    });

    expect(evidenceLedger).toContain("I-199");
    expect(evidenceLedger).toContain("I-300");
    expect(evidenceLedger).toContain("I-301");
    expect(evidenceLedger).toContain("I-400");
    if (activeBatchIsEmpty) {
      expect(activeBacklogNumbers).toHaveLength(0);
    } else {
      expect(activeBacklogNumbers.length).toBeGreaterThan(0);
    }
    expect(
      activeBacklogNumbers.every(
        (idNumber) =>
          idNumber >= activeBacklogRotation.start &&
          idNumber <= activeBacklogRotation.end,
      ),
    ).toBe(true);
    expect(backlog).not.toContain("| Done |");
    expect(offenders).toEqual([]);
  });
});

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
