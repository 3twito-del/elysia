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
const buildScript = readFileSync(
  path.join(repoRoot, "scripts/build.mjs"),
  "utf8",
);
const vercelProductionMigrateScript = readFileSync(
  path.join(repoRoot, "scripts/vercel-production-migrate.mjs"),
  "utf8",
);
const engineeringConventions = readFileSync(
  path.join(repoRoot, "docs/ENGINEERING_CONVENTIONS.md"),
  "utf8",
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
  "gate:security",
  "gate:prod",
  "gate:release-slice",
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

  it("keeps the full gate wired to QA checks", () => {
    expect(getGateDefinition("gate:full")?.includes).toContain("gate:qa");
  });

  it("keeps the ship gate strict without full QA", () => {
    const shipIncludes = getGateDefinition("gate:ship")?.includes ?? [];

    expect(shipIncludes).toContain("gate:coherence");
    expect(shipIncludes).toContain("gate:runtime");
    expect(shipIncludes).toContain("gate:security");
    expect(shipIncludes).not.toContain("gate:qa");
  });

  it("keeps the release-slice gate manual and artifact-driven", () => {
    const releaseIncludes = getGateDefinition("gate:release")?.includes ?? [];
    const releaseSlice = getGateDefinition("gate:release-slice");
    const commandText = (releaseSlice?.steps ?? [])
      .map(formatStepCommand)
      .join("\n");

    expect(releaseIncludes).not.toContain("gate:release-slice");
    expect(commandText).toContain("release:slice-gate");
    expect(commandText).toContain("--owner-intake-validation");
    expect(commandText).toContain("--release-scorecard");
    expect(packageJson.scripts["gate:slice"]).toBe(
      "node scripts/gates.mjs release-slice",
    );
  });

  it("does not register watch-mode gate commands", () => {
    const commandText = collectGateSteps().map(formatStepCommand).join("\n");

    expect(commandText).not.toMatch(/(^|\s)--watch(\s|$)/u);
    expect(commandText).not.toMatch(/(^|\s)watch(\s|$)/u);
  });

  it("keeps local development and fast verification non-mutating by default", () => {
    expect(packageJson.scripts.build).toBe("node scripts/build.mjs");
    expect(packageJson.scripts.dev).toBe("next dev --webpack");
    expect(packageJson.scripts["dev:turbo"]).toBe("next dev --turbopack");
    expect(packageJson.scripts.predev).toBeUndefined();
    expect(packageJson.scripts.prebuild).toBe(
      "pnpm copy:check && node scripts/verify-production-env.mjs && node scripts/vercel-production-migrate.mjs && node scripts/convert-public-images-to-avif.mjs --check",
    );
    expect(packageJson.scripts["verify:fast"]).toBe(
      "pnpm lint && pnpm typecheck && pnpm test",
    );
    expect(packageJson.scripts["verify:full"]).toBe("pnpm gate:release");
    expect(vercelProductionMigrateScript).toContain(
      'process.env.VERCEL === "1"',
    );
    expect(vercelProductionMigrateScript).toContain(
      'process.env.VERCEL_ENV === "production"',
    );
    expect(vercelProductionMigrateScript).toContain(
      'process.env.SKIP_VERCEL_PRODUCTION_MIGRATE !== "1"',
    );
    expect(vercelProductionMigrateScript).toContain(
      '["prisma", "migrate", "deploy"]',
    );
  });

  it("documents wall-clock regression budgets for local verification commands", () => {
    expect(engineeringConventions).toContain("## Test Wall-Clock Budgets");
    expect(engineeringConventions).toContain("2x the budget");
    expect(engineeringConventions).toContain("more than 60 seconds slower");
    expect(engineeringConventions).toContain("`pnpm test -- <path>`");
    expect(engineeringConventions).toContain("15 seconds");
    expect(engineeringConventions).toContain("`pnpm test`");
    expect(engineeringConventions).toContain("60 seconds");
    expect(engineeringConventions).toContain("`pnpm verify:fast`");
    expect(engineeringConventions).toContain("180 seconds");
    expect(engineeringConventions).toContain("`pnpm qa:routes`");
    expect(engineeringConventions).toContain("20 seconds");
  });

  it("keeps non-production builds independent from catalog database availability", () => {
    expect(buildScript).toContain('process.env.VERCEL_ENV === "production"');
    expect(buildScript).toContain("CATALOG_DB_ERROR_FALLBACK");
    expect(buildScript).toContain("E2E_CATALOG_FIXTURES");
    expect(buildScript).toContain('"next build"');
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
    expect(gatesSource).toContain('E2E_AUTH_FIXTURES: "1"');
    expect(gatesSource).toContain(
      'readDotenvValue(".env.development.local", "DATABASE_URL")',
    );
  });

  it("isolates heavy runtime browser gates with fresh preview servers", () => {
    const runtimeSteps = getGateDefinition("gate:runtime")?.steps ?? [];
    const visualStep = runtimeSteps.find(
      (step) => step.label === "Run visual QA",
    );
    const performanceStep = runtimeSteps.find(
      (step) => step.label === "Run strict performance QA",
    );

    expect(visualStep?.restartPreviewBefore).toBe(true);
    expect(performanceStep?.restartPreviewBefore).toBe(true);
  });

  it("uses a repo-managed copy-map pre-commit hook", () => {
    expect(packageJson.scripts.prepare).toBe("simple-git-hooks");
    expect(packageJson.devDependencies?.["simple-git-hooks"]).toBeDefined();
    expect(packageJson["simple-git-hooks"]?.["pre-commit"]).toBe(
      "pnpm copy:check",
    );
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
