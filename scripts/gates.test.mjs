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
  "gate:qa",
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
    expect(getGateDefinition("gate:full")?.includes).toContain("gate:qa");
  });

  it("keeps the ship gate strict without live public benchmarks", () => {
    const shipIncludes = getGateDefinition("gate:ship")?.includes ?? [];

    expect(shipIncludes).toContain("gate:coherence");
    expect(shipIncludes).toContain("gate:runtime");
    expect(shipIncludes).toContain("gate:security");
    expect(shipIncludes).not.toContain("gate:qa");
    expect(shipIncludes).not.toContain("gate:public:live");
  });

  it("does not register watch-mode gate commands", () => {
    const commandText = collectGateSteps().map(formatStepCommand).join("\n");

    expect(commandText).not.toMatch(/(^|\s)--watch(\s|$)/u);
    expect(commandText).not.toMatch(/(^|\s)watch(\s|$)/u);
  });

  it("keeps local development and fast verification non-mutating by default", () => {
    expect(packageJson.scripts.dev).toBe("next dev --webpack");
    expect(packageJson.scripts["dev:turbo"]).toBe("next dev --turbopack");
    expect(packageJson.scripts.predev).toBeUndefined();
    expect(packageJson.scripts.prebuild).toBe(
      "node scripts/verify-production-env.mjs && node scripts/convert-public-images-to-avif.mjs --check",
    );
    expect(packageJson.scripts["verify:fast"]).toBe(
      "pnpm lint && pnpm typecheck && pnpm test",
    );
    expect(packageJson.scripts["verify:full"]).toBe("pnpm gate:release");
  });

  it("keeps gate:fix as the only mutating gate stage", () => {
    expect(getGateDefinition("gate:full")?.includes?.[0]).toBe("gate:fix");
    expect(getGateDefinition("gate:ship")?.includes?.[0]).toBe("gate:fix");

    for (const gate of gateDefinitions) {
      expect(gate.needsFix).toBeUndefined();
      if (gate.name === "gate:fix") continue;

      const commandText = (gate.steps ?? []).map(formatStepCommand).join("\n");

      expect(stepCommandsWriteFiles(commandText)).toBe(false);
    }
  });

  it("keeps local preview gates on the same build-safe catalog fixtures", () => {
    const gatesSource = readFileSync(
      path.join(repoRoot, "scripts/gates.mjs"),
      "utf8",
    );

    expect(gatesSource).toContain(
      "env: { ...process.env, ...buildSafeCatalogEnv(), PORT: `${port}` }",
    );
  });

  it("runs public benchmarks against the production preview server", () => {
    for (const gateName of ["gate:public:local", "gate:public:live"]) {
      const gate = getGateDefinition(gateName);
      const commandText = (gate?.steps ?? []).map(formatStepCommand).join("\n");

      expect(gate?.preview).toBe(true);
      expect(commandText).toContain("--base-url");
    }
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

function stepCommandsWriteFiles(commandText) {
  return (
    commandText.includes("--fix") ||
    commandText.includes("--write") ||
    commandText.includes("prisma format") ||
    commandText.includes("prisma generate") ||
    (commandText.includes("scripts/convert-public-images-to-avif.mjs") &&
      !commandText.includes("--check"))
  );
}
