import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const historicalBenchmarkBacklogIds = new Set(
  Array.from(
    { length: 200 },
    (_, index) => `I-${String(index + 1).padStart(3, "0")}`,
  ),
);
const activeBacklogRotation = {
  end: 300,
  start: 201,
} as const;

describe("QA benchmark traceability", () => {
  it("keeps benchmark backlog references current or intentionally historical", () => {
    const backlog = read("docs/MULTI_ASPECT_IMPROVEMENT_BACKLOG.md");
    const activeBacklogIds = new Set(
      Array.from(backlog.matchAll(/\|\s*(I-\d{3})\s*\|/g), (match) => {
        const id = match[1];

        if (!id) throw new Error("Backlog ID capture failed.");

        return id;
      }),
    );
    const qaDocs = readdirSync(path.join(root, "docs", "qa"))
      .filter((entry) => entry.endsWith(".md"))
      .map((entry) => `docs/qa/${entry}`);
    const offenders = qaDocs.flatMap((file) => {
      const contents = read(file);
      const backlogItemLines = contents
        .split("\n")
        .filter((line) => line.includes("`Backlog Item`"));

      return backlogItemLines.flatMap((line) => {
        const ids = Array.from(line.matchAll(/\bI-\d{3}\b/g), (match) => {
          const id = match[0];

          return id;
        });

        if (ids.length === 0) return [`${file}: missing backlog ID`];

        return ids
          .filter(
            (id) =>
              !activeBacklogIds.has(id) &&
              !historicalBenchmarkBacklogIds.has(id),
          )
          .map((id) => `${file}: unknown backlog ID ${id}`);
      });
    });

    expect(read("docs/qa/benchmark-traceability.md")).toContain("I-199");
    expect(read("docs/qa/benchmark-traceability.md")).toContain("I-201");
    expect(read("docs/qa/benchmark-traceability.md")).toContain("I-300");
    for (
      let idNumber = activeBacklogRotation.start;
      idNumber <= activeBacklogRotation.end;
      idNumber += 1
    ) {
      expect(activeBacklogIds.has(`I-${idNumber}`)).toBe(true);
    }
    expect(offenders).toEqual([]);
  });
});

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
