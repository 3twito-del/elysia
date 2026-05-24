import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = path.resolve(import.meta.dirname, "..");
const maxSourceLines = 700;
const sourceRoots = ["src", "scripts"];
const sourceExtensions = new Set([
  ".cjs",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".mts",
  ".ts",
  ".tsx",
]);
const ignoredPathParts = new Set([
  ".git",
  ".next",
  ".vercel",
  "coverage",
  "dist",
  "node_modules",
]);

const largeFileExceptions = new Map([
  [
    "src/app/checkout/_components/cart-checkout-form.tsx",
    "checkout form coordination; extracted status and workflow helpers remain behind the stable component import",
  ],
  [
    "src/app/search/page.tsx",
    "route-level public search composition; URL and visual contract stay stable while state helpers live in _lib",
  ],
  [
    "src/server/adapters/search.ts",
    "search-provider adapter facade coordinating Typesense, semantic, and local fallback paths",
  ],
  [
    "src/server/services/admin-operations.ts",
    "admin operations read-model facade over extracted integration and workflow helpers",
  ],
  [
    "scripts/benchmarks/core.ts",
    "benchmark harness core used only by manual public QA gates; live benchmark depth stays outside gate:ship",
  ],
]);

const debtMarkers = [
  createDebtMarker(["TO", "DO"].join(""), { word: true }),
  createDebtMarker(["FIX", "ME"].join(""), { word: true }),
  createDebtMarker(["HA", "CK"].join(""), { word: true }),
  createDebtMarker(["@ts", "-ignore"].join("")),
];

const violations = [];

for (const filePath of listSourceFiles()) {
  const absolutePath = path.join(repoRoot, filePath);
  const content = readFileSync(absolutePath, "utf8");
  const lines = content.split(/\r?\n/u);

  checkDebtMarkers(filePath, lines);
  checkFileSize(filePath, lines);
  checkArchitectureBoundaries(filePath, content);
}

if (violations.length > 0) {
  console.error("Coherence contract failed:");

  for (const violation of violations) {
    console.error(`- ${violation}`);
  }

  process.exit(1);
}

console.log(
  `Coherence contract passed for ${listSourceFiles().length} source files.`,
);

function listSourceFiles() {
  const gitFiles = listGitFiles();

  if (gitFiles.length > 0) {
    return gitFiles
      .map(toPosixPath)
      .filter((filePath) =>
        sourceRoots.some((root) => filePath.startsWith(`${root}/`)),
      )
      .filter((filePath) => sourceExtensions.has(path.extname(filePath)));
  }

  return sourceRoots.flatMap((root) => walkPath(path.join(repoRoot, root)));
}

function listGitFiles() {
  const result = spawnSync(
    "git",
    [
      "ls-files",
      "--cached",
      "--others",
      "--exclude-standard",
      "--",
      ...sourceRoots,
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
    },
  );

  if (result.status !== 0) return [];

  return result.stdout
    .split(/\r?\n/u)
    .map((item) => item.trim())
    .filter(Boolean);
}

function walkPath(absolutePath) {
  if (!existsSync(absolutePath)) return [];

  const stats = statSync(absolutePath);

  if (stats.isFile()) {
    const filePath = toPosixPath(path.relative(repoRoot, absolutePath));
    return sourceExtensions.has(path.extname(filePath)) ? [filePath] : [];
  }

  if (!stats.isDirectory()) return [];

  const basename = path.basename(absolutePath);
  if (ignoredPathParts.has(basename)) return [];

  return readdirSync(absolutePath).flatMap((entry) =>
    walkPath(path.join(absolutePath, entry)),
  );
}

function checkDebtMarkers(filePath, lines) {
  lines.forEach((line, index) => {
    for (const marker of debtMarkers) {
      if (!marker.pattern.test(line)) continue;

      violations.push(
        `${filePath}:${index + 1} contains unapproved debt marker ${marker.marker}`,
      );
    }
  });
}

function checkFileSize(filePath, lines) {
  const lineCount = lines.length;
  if (lineCount <= maxSourceLines) return;

  const exceptionReason = largeFileExceptions.get(filePath);
  if (exceptionReason) return;

  violations.push(
    `${filePath} has ${lineCount} lines; split it below ${maxSourceLines} lines or document an explicit coherence exception`,
  );
}

function checkArchitectureBoundaries(filePath, content) {
  if (filePath.startsWith("src/server/services/")) {
    checkServiceBoundary(filePath, content);
  }

  if (filePath.startsWith("src/server/adapters/")) {
    checkAdapterBoundary(filePath, content);
  }

  if (
    filePath.startsWith("src/app/api/") ||
    filePath.startsWith("src/server/api/routers/")
  ) {
    checkRouteBoundary(filePath, content);
  }
}

function checkServiceBoundary(filePath, content) {
  for (const importPath of getImportPaths(content)) {
    if (
      importPath.startsWith("~/components") ||
      importPath.startsWith("~/app") ||
      importPath.includes("/_components") ||
      importPath === "lucide-react" ||
      importPath === "motion" ||
      importPath.startsWith("radix-ui")
    ) {
      violations.push(
        `${filePath} imports UI module "${importPath}"; keep services domain-only`,
      );
    }
  }
}

function checkAdapterBoundary(filePath, content) {
  for (const importPath of getImportPaths(content)) {
    if (importPath === "~/server/db" || importPath.endsWith("/server/db")) {
      violations.push(
        `${filePath} imports the database directly; keep business transactions in services`,
      );
    }
  }

  if (/\.\$transaction\s*\(/u.test(content)) {
    violations.push(
      `${filePath} opens a transaction; adapters should only wrap provider/SDK behavior`,
    );
  }
}

function checkRouteBoundary(filePath, content) {
  for (const importPath of getImportPaths(content)) {
    if (
      importPath === "~/server/db" ||
      importPath.endsWith("/server/db") ||
      importPath === "@prisma/client"
    ) {
      violations.push(
        `${filePath} imports persistence directly; route handlers should validate I/O and call services`,
      );
    }
  }

  if (/\.\$transaction\s*\(/u.test(content)) {
    violations.push(
      `${filePath} opens a transaction; move domain work into a service`,
    );
  }
}

function getImportPaths(content) {
  const matches = content.matchAll(
    /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/gu,
  );

  return Array.from(matches, (match) => match[1]).filter(Boolean);
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

function createDebtMarker(marker, options = {}) {
  const escapedMarker = marker.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const pattern = options.word
    ? new RegExp(`\\b${escapedMarker}\\b`, "u")
    : new RegExp(escapedMarker, "u");

  return { marker, pattern };
}
