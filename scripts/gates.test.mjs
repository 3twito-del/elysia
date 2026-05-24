import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  collectGateSteps,
  formatStepCommand,
  gateDefinitions,
  getGateDefinition,
} from "./gates.mjs";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const packageJson = JSON.parse(
  readFileSync(path.join(repoRoot, "package.json"), "utf8"),
);

const expectedGateNames = [
  "gate:list",
  "gate:fix",
  "gate:quick",
  "gate:test",
  "gate:db",
  "gate:build",
  "gate:smoke",
  "gate:e2e",
  "gate:visual",
  "gate:runtime",
  "gate:coherence",
  "gate:public:local",
  "gate:public:live",
  "gate:security",
  "gate:prod",
  "gate:full",
  "gate:ship",
  "gate:release",
];

describe("manual quality gates", () => {
  it("exposes every registered gate through package scripts", () => {
    expect(gateDefinitions.map((gate) => gate.name)).toEqual(expectedGateNames);

    for (const gateName of expectedGateNames) {
      expect(packageJson.scripts[gateName]).toBe(
        `node scripts/gates.mjs ${gateName.slice("gate:".length)}`,
      );
    }
  });

  it("keeps the full gate wired to live public benchmarks", () => {
    expect(getGateDefinition("gate:full")?.includes).toContain(
      "gate:public:live",
    );
  });

  it("keeps the ship gate strict without live public benchmarks", () => {
    const shipIncludes = getGateDefinition("gate:ship")?.includes ?? [];

    expect(shipIncludes).toContain("gate:coherence");
    expect(shipIncludes).toContain("gate:runtime");
    expect(shipIncludes).toContain("gate:security");
    expect(shipIncludes).not.toContain("gate:public:live");
  });

  it("does not register watch-mode gate commands", () => {
    const commandText = collectGateSteps().map(formatStepCommand).join("\n");

    expect(commandText).not.toMatch(/(^|\s)--watch(\s|$)/u);
    expect(commandText).not.toMatch(/(^|\s)watch(\s|$)/u);
  });

  it("does not introduce local commit hooks", () => {
    expect(packageJson.scripts.prepare).toBeUndefined();
    expect(packageJson.dependencies?.husky).toBeUndefined();
    expect(packageJson.devDependencies?.husky).toBeUndefined();
    expect(packageJson.dependencies?.["lint-staged"]).toBeUndefined();
    expect(packageJson.devDependencies?.["lint-staged"]).toBeUndefined();
    expect(existsSync(path.join(repoRoot, ".husky"))).toBe(false);
  });
});
