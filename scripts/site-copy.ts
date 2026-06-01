import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import ts from "typescript";

const ROOT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const COPY_MAP_PATH = path.join(ROOT_DIR, "docs", "SITE_COPY_MAP.md");
const ENTRY_MARKER = "site-copy-entry";
const TEXT_FENCE = "~~~text";

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);
const EXCLUDED_FILE_PATTERNS = [
  /\.d\.ts$/u,
  /\.test\.[cm]?[jt]sx?$/u,
  /\.spec\.[cm]?[jt]sx?$/u,
  /(^|[\\/])__tests__([\\/]|$)/u,
  /(^|[\\/])node_modules([\\/]|$)/u,
  /(^|[\\/])\.next([\\/]|$)/u,
  /(^|[\\/])generated([\\/]|$)/u,
  /(^|[\\/])prisma[\\/]seed-catalog\.ts$/u,
];

const PRODUCT_MANAGED_PROPERTY_NAMES = new Set([
  "categoryName",
  "careInstructions",
  "collectionName",
  "deliveryPromise",
  "heroImageAlt",
  "materialName",
  "metalColors",
  "productName",
  "returnPolicy",
  "shortDescription",
  "stoneName",
  "tags",
  "variant",
  "variantName",
  "warranty",
]);

const PRODUCT_MANAGED_FILES = new Set([
  normalizePath("src/server/services/catalog-fixtures.ts"),
  normalizePath("src/server/services/shopify-dropship-sync.ts"),
]);

type CopyKind =
  | "jsx-text"
  | "jsx-attribute"
  | "template"
  | "validation"
  | "server-message"
  | "metadata"
  | "string";

type ReplacementKind = "jsx-text" | "string" | "template";

export type CopyEntry = {
  approved: string;
  column: number;
  end: number;
  id: string;
  kind: CopyKind;
  line: number;
  path: string;
  replacementKind: ReplacementKind;
  source: string;
  sourceHash: string;
  start: number;
};

type ExistingEntry = {
  approved: string;
  id: string;
  kind: CopyKind;
  path: string;
  source: string;
  sourceHash: string;
};

type CheckResult = {
  errors: string[];
  pendingApprovedChanges: number;
};

type SourceFileInfo = {
  absolutePath: string;
  relativePath: string;
};

function normalizePath(filePath: string) {
  return filePath.replaceAll("\\", "/");
}

function toRelativePath(filePath: string) {
  return normalizePath(path.relative(ROOT_DIR, filePath));
}

function hasHebrew(value: string) {
  return /[\u0590-\u05FF]/u.test(value);
}

function sha1(value: string) {
  return createHash("sha1").update(value).digest("hex").slice(0, 12);
}

function slugify(value: string) {
  return value
    .replace(/\.[^.]+$/u, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "")
    .slice(0, 80);
}

function makeEntryId(relativePath: string, index: number) {
  return `copy.${slugify(relativePath)}.${String(index + 1).padStart(3, "0")}`;
}

function escapeAttribute(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function unescapeAttribute(value: string) {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&gt;", ">")
    .replaceAll("&lt;", "<")
    .replaceAll("&amp;", "&");
}

function getLineAndColumn(sourceFile: ts.SourceFile, position: number) {
  const location = sourceFile.getLineAndCharacterOfPosition(position);

  return {
    column: location.character + 1,
    line: location.line + 1,
  };
}

function normalizeJsxText(value: string) {
  return value.replace(/\s+/gu, " ").trim();
}

function getPropertyName(node: ts.Node) {
  if (
    ts.isPropertyAssignment(node) ||
    ts.isShorthandPropertyAssignment(node) ||
    ts.isPropertyDeclaration(node) ||
    ts.isJsxAttribute(node)
  ) {
    const name = node.name;

    if (ts.isIdentifier(name) || ts.isStringLiteral(name)) {
      return name.text;
    }
  }

  return undefined;
}

function getNearestPropertyName(node: ts.Node) {
  let current: ts.Node | undefined = node.parent;

  while (current) {
    const propertyName = getPropertyName(current);

    if (propertyName) {
      return propertyName;
    }

    if (
      ts.isCallExpression(current) ||
      ts.isFunctionLike(current) ||
      ts.isSourceFile(current)
    ) {
      return undefined;
    }

    current = current.parent;
  }

  return undefined;
}

function getFunctionName(node: ts.Node) {
  if (
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isMethodDeclaration(node)
  ) {
    return node.name?.getText();
  }

  if (ts.isArrowFunction(node)) {
    const parent = node.parent;

    if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) {
      return parent.name.text;
    }
  }

  return undefined;
}

function isInsideFunction(node: ts.Node, functionNames: ReadonlySet<string>) {
  let current: ts.Node | undefined = node.parent;

  while (current) {
    const functionName = getFunctionName(current);

    if (functionName && functionNames.has(functionName)) {
      return true;
    }

    current = current.parent;
  }

  return false;
}

function isNodeName(node: ts.Node) {
  const parent = node.parent;

  if (!parent) return false;

  if (
    (ts.isPropertyAssignment(parent) ||
      ts.isMethodDeclaration(parent) ||
      ts.isPropertyDeclaration(parent)) &&
    parent.name === node
  ) {
    return true;
  }

  return ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent);
}

function isProductManagedContext(node: ts.Node, relativePath: string) {
  const normalizedPath = normalizePath(relativePath);

  if (PRODUCT_MANAGED_FILES.has(normalizedPath)) {
    return true;
  }

  if (
    normalizedPath === normalizePath("prisma/seed.ts") &&
    isInsideFunction(node, new Set(["getSeedCommerceHighlights"]))
  ) {
    return true;
  }

  const propertyName = getNearestPropertyName(node);

  return propertyName
    ? PRODUCT_MANAGED_PROPERTY_NAMES.has(propertyName)
    : false;
}

function shouldSkipLiteral(node: ts.Node, relativePath: string) {
  if (isNodeName(node)) return true;
  if (ts.isLiteralTypeNode(node.parent)) return true;

  return isProductManagedContext(node, relativePath);
}

function classifyNode(
  node: ts.Node,
  relativePath: string,
  replacementKind: ReplacementKind,
): CopyKind {
  if (replacementKind === "jsx-text") return "jsx-text";
  if (replacementKind === "template") return "template";
  if (ts.isJsxAttribute(node.parent)) return "jsx-attribute";
  if (relativePath.endsWith("validation.ts")) return "validation";
  if (/(^|\/)server\//u.test(relativePath)) return "server-message";
  if (/metadata|manifest|layout|page\.tsx$/u.test(relativePath)) {
    const propertyName = getNearestPropertyName(node);

    if (
      propertyName &&
      ["description", "title", "applicationName", "aria-label"].includes(
        propertyName,
      )
    ) {
      return "metadata";
    }
  }

  return "string";
}

function createEntry(
  entries: CopyEntry[],
  sourceFile: ts.SourceFile,
  relativePath: string,
  node: ts.Node,
  source: string,
  start: number,
  end: number,
  replacementKind: ReplacementKind,
) {
  const cleanedSource =
    replacementKind === "jsx-text" ? normalizeJsxText(source) : source.trim();

  if (!cleanedSource || !hasHebrew(cleanedSource)) {
    return;
  }

  const location = getLineAndColumn(sourceFile, start);
  const kind = classifyNode(node, relativePath, replacementKind);

  entries.push({
    approved: cleanedSource,
    column: location.column,
    end,
    id: "",
    kind,
    line: location.line,
    path: relativePath,
    replacementKind,
    source: cleanedSource,
    sourceHash: sha1(cleanedSource),
    start,
  });
}

function getTemplateSource(
  node: ts.TemplateExpression,
  sourceFile: ts.SourceFile,
) {
  return node.templateSpans.reduce(
    (value, span) =>
      `${value}\${${span.expression.getText(sourceFile)}}}${span.literal.text}`,
    node.head.text,
  );
}

export function extractCopyEntriesFromText(
  relativePath: string,
  sourceText: string,
) {
  const scriptKind = relativePath.endsWith(".tsx")
    ? ts.ScriptKind.TSX
    : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(
    relativePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  );
  const entries: CopyEntry[] = [];

  function visit(node: ts.Node) {
    if (ts.isJsxText(node)) {
      createEntry(
        entries,
        sourceFile,
        relativePath,
        node,
        node.getFullText(sourceFile),
        node.getFullStart(),
        node.end,
        "jsx-text",
      );
    } else if (
      ts.isStringLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node)
    ) {
      if (!shouldSkipLiteral(node, relativePath)) {
        createEntry(
          entries,
          sourceFile,
          relativePath,
          node,
          node.text,
          node.getStart(sourceFile),
          node.end,
          "string",
        );
      }
    } else if (ts.isTemplateExpression(node)) {
      if (!shouldSkipLiteral(node, relativePath)) {
        createEntry(
          entries,
          sourceFile,
          relativePath,
          node,
          getTemplateSource(node, sourceFile),
          node.getStart(sourceFile),
          node.end,
          "template",
        );
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return entries.map((entry, index) => ({
    ...entry,
    id: makeEntryId(relativePath, index),
  }));
}

async function walkSourceFiles(dirPath: string): Promise<SourceFileInfo[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const results = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        return walkSourceFiles(absolutePath);
      }

      const relativePath = toRelativePath(absolutePath);

      if (
        !entry.isFile() ||
        !SOURCE_EXTENSIONS.has(path.extname(entry.name)) ||
        EXCLUDED_FILE_PATTERNS.some((pattern) => pattern.test(relativePath))
      ) {
        return [];
      }

      return [{ absolutePath, relativePath }];
    }),
  );

  return results.flat();
}

async function getSourceFiles() {
  const sourceFiles = await walkSourceFiles(path.join(ROOT_DIR, "src"));
  const prismaSeedPath = path.join(ROOT_DIR, "prisma", "seed.ts");

  if (existsSync(prismaSeedPath)) {
    sourceFiles.push({
      absolutePath: prismaSeedPath,
      relativePath: toRelativePath(prismaSeedPath),
    });
  }

  return sourceFiles.sort((left, right) =>
    left.relativePath.localeCompare(right.relativePath),
  );
}

export async function extractCopyEntries() {
  const sourceFiles = await getSourceFiles();
  const nestedEntries = await Promise.all(
    sourceFiles.map(async (sourceFile) => {
      const sourceText = await readFile(sourceFile.absolutePath, "utf8");

      return extractCopyEntriesFromText(sourceFile.relativePath, sourceText);
    }),
  );

  return nestedEntries.flat();
}

function blockValue(block: string, title: string) {
  const marker = `#### ${title}\n${TEXT_FENCE}\n`;
  const start = block.indexOf(marker);

  if (start === -1) return "";

  const valueStart = start + marker.length;
  const valueEnd = block.indexOf("\n~~~", valueStart);

  if (valueEnd === -1) return "";

  return block.slice(valueStart, valueEnd);
}

function readAttribute(block: string, name: string) {
  const match = new RegExp(`${name}="([^"]*)"`, "u").exec(block);

  return match ? unescapeAttribute(match[1] ?? "") : "";
}

export function parseCopyMap(markdown: string) {
  const entries = new Map<string, ExistingEntry>();
  const blocks = markdown
    .split(`<!-- ${ENTRY_MARKER} `)
    .slice(1)
    .map((block) => block.slice(0, block.indexOf(`<!-- /${ENTRY_MARKER} -->`)));

  for (const block of blocks) {
    const id = readAttribute(block, "id");

    if (!id) continue;

    entries.set(id, {
      approved: blockValue(block, "נוסח מאושר"),
      id,
      kind: readAttribute(block, "kind") as CopyKind,
      path: readAttribute(block, "path"),
      source: blockValue(block, "טקסט באתר"),
      sourceHash: readAttribute(block, "sourceHash"),
    });
  }

  return entries;
}

async function readExistingCopyMap() {
  if (!existsSync(COPY_MAP_PATH)) {
    return new Map<string, ExistingEntry>();
  }

  return parseCopyMap(await readFile(COPY_MAP_PATH, "utf8"));
}

function renderEntry(entry: CopyEntry) {
  const status = entry.approved === entry.source ? "synced" : "pending-apply";

  return [
    `<!-- ${ENTRY_MARKER} id="${escapeAttribute(entry.id)}" path="${escapeAttribute(
      entry.path,
    )}" kind="${entry.kind}" sourceHash="${entry.sourceHash}" -->`,
    `### \`${entry.id}\``,
    "",
    `- מקור: \`${entry.path}:${entry.line}:${entry.column}\``,
    `- סוג: \`${entry.kind}\``,
    `- סטטוס: \`${status}\``,
    "",
    "#### טקסט באתר",
    TEXT_FENCE,
    entry.source,
    "~~~",
    "",
    "#### נוסח מאושר",
    TEXT_FENCE,
    entry.approved,
    "~~~",
    `<!-- /${ENTRY_MARKER} -->`,
  ].join("\n");
}

export function renderCopyMap(entries: CopyEntry[]) {
  const generatedAt = new Date().toISOString();
  const pendingCount = entries.filter(
    (entry) => entry.approved !== entry.source,
  ).length;

  return `${[
    "# SITE COPY MAP",
    "",
    "<!--",
    "Generated by pnpm copy:sync.",
    "Edit only the 'נוסח מאושר' fenced blocks. Run pnpm copy:apply to apply approved copy to the site.",
    "Product content that is editable in admin is intentionally excluded.",
    `generatedAt=${generatedAt}`,
    `entries=${entries.length}`,
    `pendingApply=${pendingCount}`,
    "-->",
    "",
    "מסמך פעיל לעריכת טקסטים באתר. אין לשנות את מזהי הפריטים או metadata בהערות.",
    "",
    ...entries.map(renderEntry),
    "",
  ].join("\n")}`;
}

function mergeEntriesWithExisting(
  entries: CopyEntry[],
  existingEntries: Map<string, ExistingEntry>,
) {
  return entries.map((entry) => {
    const existingEntry = existingEntries.get(entry.id);
    const approved =
      existingEntry && existingEntry.approved !== existingEntry.source
        ? existingEntry.approved
        : entry.source;

    return {
      ...entry,
      approved,
    };
  });
}

export async function syncCopyMap() {
  const existingEntries = await readExistingCopyMap();
  const entries = mergeEntriesWithExisting(
    await extractCopyEntries(),
    existingEntries,
  );
  const markdown = renderCopyMap(entries);

  await mkdir(path.dirname(COPY_MAP_PATH), { recursive: true });
  await writeFile(COPY_MAP_PATH, markdown, "utf8");

  return entries;
}

export function checkCopyMapEntries(
  currentEntries: CopyEntry[],
  existingEntries: Map<string, ExistingEntry>,
): CheckResult {
  const errors: string[] = [];
  const currentById = new Map(currentEntries.map((entry) => [entry.id, entry]));
  let pendingApprovedChanges = 0;

  for (const entry of currentEntries) {
    const existingEntry = existingEntries.get(entry.id);

    if (!existingEntry) {
      errors.push(
        `Missing copy map entry: ${entry.id} (${entry.path}:${entry.line})`,
      );
      continue;
    }

    if (existingEntry.path !== entry.path) {
      errors.push(
        `Path mismatch for ${entry.id}: ${existingEntry.path} != ${entry.path}`,
      );
    }

    if (
      existingEntry.sourceHash !== entry.sourceHash ||
      existingEntry.source !== entry.source
    ) {
      errors.push(
        `Source text is out of sync for ${entry.id} (${entry.path}:${entry.line})`,
      );
    }

    if (existingEntry.approved !== entry.source) {
      pendingApprovedChanges += 1;
    }
  }

  for (const existingEntry of existingEntries.values()) {
    if (!currentById.has(existingEntry.id)) {
      errors.push(
        `Stale copy map entry: ${existingEntry.id} (${existingEntry.path})`,
      );
    }
  }

  return { errors, pendingApprovedChanges };
}

export async function checkCopyMap() {
  const existingEntries = await readExistingCopyMap();

  if (existingEntries.size === 0) {
    return {
      errors: ["Missing docs/SITE_COPY_MAP.md. Run pnpm copy:sync."],
      pendingApprovedChanges: 0,
    };
  }

  return checkCopyMapEntries(await extractCopyEntries(), existingEntries);
}

function quoteString(value: string, originalSource: string) {
  if (originalSource.startsWith("`")) {
    return `\`${value.replaceAll("`", "\\`").replaceAll("${", "\\${")}\``;
  }

  return JSON.stringify(value);
}

function jsxText(value: string) {
  return value.replaceAll("<", "&lt;").replaceAll("{", "&#123;");
}

function placeholders(value: string) {
  return [...value.matchAll(/\$\{[^}]+\}/gu)].map((match) => match[0]);
}

function templateLiteral(value: string, currentSource: string, id: string) {
  const currentPlaceholders = placeholders(currentSource);
  const approvedPlaceholders = placeholders(value);

  if (currentPlaceholders.join("\n") !== approvedPlaceholders.join("\n")) {
    throw new Error(
      `Template placeholders changed for ${id}. Keep placeholders unchanged.`,
    );
  }

  return `\`${value.replaceAll("`", "\\`")}\``;
}

function replacementForEntry(entry: CopyEntry, fileText: string) {
  const originalSource = fileText.slice(entry.start, entry.end);

  if (entry.replacementKind === "jsx-text") {
    return jsxText(entry.approved);
  }

  if (entry.replacementKind === "template") {
    return templateLiteral(entry.approved, entry.source, entry.id);
  }

  return quoteString(entry.approved, originalSource);
}

export function applyApprovedCopyToText(
  fileText: string,
  entries: CopyEntry[],
) {
  let updatedText = fileText;

  for (const entry of entries.sort((left, right) => right.start - left.start)) {
    updatedText =
      updatedText.slice(0, entry.start) +
      replacementForEntry(entry, updatedText) +
      updatedText.slice(entry.end);
  }

  return updatedText;
}

export async function applyCopyMap() {
  const existingEntries = await readExistingCopyMap();
  const currentEntries = mergeEntriesWithExisting(
    await extractCopyEntries(),
    existingEntries,
  );
  const byFile = new Map<string, CopyEntry[]>();

  for (const entry of currentEntries) {
    if (entry.approved === entry.source) continue;

    const entries = byFile.get(entry.path) ?? [];
    entries.push(entry);
    byFile.set(entry.path, entries);
  }

  let changedFiles = 0;
  let changedEntries = 0;

  for (const [relativePath, entries] of byFile.entries()) {
    const absolutePath = path.join(ROOT_DIR, relativePath);
    const fileText = await readFile(absolutePath, "utf8");
    const updatedText = applyApprovedCopyToText(fileText, entries);

    await writeFile(absolutePath, updatedText, "utf8");
    changedFiles += 1;
    changedEntries += entries.length;
  }

  await syncCopyMap();

  return { changedEntries, changedFiles };
}

async function main() {
  const command = process.argv[2] ?? "check";

  if (command === "sync") {
    const entries = await syncCopyMap();
    console.log(
      `Synced ${entries.length} copy entries to docs/SITE_COPY_MAP.md.`,
    );
    return;
  }

  if (command === "apply") {
    const result = await applyCopyMap();
    console.log(
      `Applied ${result.changedEntries} copy entries across ${result.changedFiles} files.`,
    );
    return;
  }

  if (command === "check") {
    const result = await checkCopyMap();

    if (result.errors.length > 0) {
      console.error(result.errors.join("\n"));
      console.error("Run pnpm copy:sync and review docs/SITE_COPY_MAP.md.");
      process.exitCode = 1;
      return;
    }

    if (result.pendingApprovedChanges > 0) {
      console.log(
        `Copy map is synced. ${result.pendingApprovedChanges} approved entries are pending pnpm copy:apply.`,
      );
      return;
    }

    console.log("Copy map is synced.");
    return;
  }

  throw new Error(`Unknown site copy command: ${command}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
