import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const SCANNED_ROOTS = ["src", "scripts"] as const;
const SCANNED_EXTENSIONS = new Set([
  ".cjs",
  ".js",
  ".jsx",
  ".mjs",
  ".ts",
  ".tsx",
]);
const IGNORED_PATHS = new Set(["src/lib/security-guardrails.test.ts"]);

const SECRET_PATTERNS = [
  {
    name: "private key",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
  },
  {
    name: "AWS access key",
    pattern: /AKIA[0-9A-Z]{16}/,
  },
  {
    name: "GitHub token",
    pattern: /gh[pousr]_[A-Za-z0-9_]{36,}/,
  },
  {
    name: "Google API key",
    pattern: /AIza[0-9A-Za-z_-]{35}/,
  },
  {
    name: "OpenAI API key",
    pattern: /sk-[A-Za-z0-9]{32,}/,
  },
  {
    name: "live payment secret",
    pattern: /(?:sk|rk)_live_[A-Za-z0-9]{16,}/,
  },
] as const;

describe("security guardrails", () => {
  it("keeps production secrets out of source-controlled code", () => {
    const offenders = getScannedFiles()
      .flatMap((filePath) => {
        const contents = readFileSync(filePath, "utf8");
        const relativePath = normalizePath(relative(process.cwd(), filePath));

        return SECRET_PATTERNS.filter(({ pattern }) =>
          pattern.test(contents),
        ).map(({ name }) => `${relativePath}: ${name}`);
      })
      .sort();

    expect(offenders).toEqual([]);
  });

  it("keeps webhook failure logs on the safe context path", () => {
    const webhookRoutes = [
      "src/app/api/webhooks/cardcom/route.ts",
      "src/app/api/webhooks/cloudinary/route.ts",
      "src/app/api/webhooks/shopify/orders/route.ts",
    ];

    const offenders = webhookRoutes.flatMap((route) => {
      const contents = readFileSync(join(process.cwd(), route), "utf8");
      const issues: string[] = [];

      if (!contents.includes("createWebhookSafeLogContext")) {
        issues.push(`${route}: missing safe log context`);
      }

      if (!contents.includes("createWebhookErrorSummary")) {
        issues.push(`${route}: missing redacted error summary`);
      }

      const consoleErrorCalls = contents.match(/console\.error\([\s\S]*?\);/g);

      for (const call of consoleErrorCalls ?? []) {
        if (/,\s*error\s*[,)]/.test(call)) {
          issues.push(`${route}: logs raw error object`);
        }

        if (/,\s*(rawBody|payload)\s*[,)]/.test(call)) {
          issues.push(`${route}: logs raw webhook body or payload`);
        }
      }

      return issues;
    });

    expect(offenders).toEqual([]);
  });
});

function getScannedFiles() {
  return SCANNED_ROOTS.flatMap((root) => collectFiles(root));
}

function collectFiles(path: string): string[] {
  const stats = statSync(path);

  if (stats.isDirectory()) {
    return readdirSync(path).flatMap((entry) =>
      collectFiles(join(path, entry)),
    );
  }

  const normalized = normalizePath(path);

  if (IGNORED_PATHS.has(normalized)) return [];
  if (!SCANNED_EXTENSIONS.has(getExtension(normalized))) return [];

  return [path];
}

function getExtension(path: string) {
  const index = path.lastIndexOf(".");

  return index === -1 ? "" : path.slice(index);
}

function normalizePath(path: string) {
  return path.replaceAll("\\", "/");
}
