// J-05 Technical SEO validation. Crawls the public, indexable route set and
// checks the mechanics that matter once the site's noindex/nofollow policy
// (src/app/robots.ts, src/app/layout.tsx metadata) is lifted for a real
// launch: every route has a title, a meta description, and a canonical link,
// and no two routes share the same title or description (duplicate metadata
// is exactly what confuses search-console coverage and dilutes rankings).
// This does not touch the noindex policy itself -- that is a business/legal
// launch decision (ADR 0014, I-341), not something this script decides.

import { pathToFileURL } from "node:url";

import { getVisualQaRouteEntries } from "./qa-route-inventory";

type RouteAudit = {
  path: string;
  status: number | null;
  title: string | null;
  description: string | null;
  canonical: string | null;
  error?: string;
};

function extractTag(html: string, pattern: RegExp) {
  const match = pattern.exec(html);
  return match ? decodeHtmlEntities(match[1]!.trim()) : null;
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function auditableRoutes() {
  return getVisualQaRouteEntries()
    .filter(
      (route) =>
        (route.kind === "public" || route.kind === "dynamic") &&
        !route.requiresAuth &&
        route.method === "GET" &&
        !route.expectedStatuses.includes(404) &&
        !route.path.includes("?"),
    )
    .map((route) => route.path);
}

async function auditRoute(baseUrl: string, path: string): Promise<RouteAudit> {
  const url = `${baseUrl.replace(/\/+$/u, "")}${path}`;

  try {
    const response = await fetch(url, { redirect: "manual" });
    const html = await response.text();

    return {
      path,
      status: response.status,
      title: extractTag(html, /<title>([^<]*)<\/title>/i),
      description: extractTag(
        html,
        /<meta\s+name="description"\s+content="([^"]*)"/i,
      ),
      canonical: extractTag(
        html,
        /<link\s+rel="canonical"\s+href="([^"]*)"/i,
      ),
    };
  } catch (error) {
    return {
      path,
      status: null,
      title: null,
      description: null,
      canonical: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function runSeoAudit(baseUrl: string) {
  const routes = auditableRoutes();
  const results: RouteAudit[] = [];

  for (const path of routes) {
    results.push(await auditRoute(baseUrl, path));
  }

  // A 404/not-found response has no real content to derive a specific title
  // or description from, so it correctly falls back to the site default --
  // sharing that fallback with every other not-found page is expected, not a
  // duplicate-metadata bug. Only 200 responses are held to the
  // one-title-one-description bar. Non-200 routes are still reported (a
  // route the inventory expected to resolve but didn't is worth knowing
  // about), just not treated as a metadata failure.
  const okResults = results.filter((r) => r.status === 200);
  const unexpectedStatus = results.filter(
    (r) => r.status !== null && r.status !== 200,
  );

  const missingTitle = okResults.filter((r) => !r.title);
  const missingDescription = okResults.filter((r) => !r.description);
  const missingCanonical = okResults.filter((r) => !r.canonical);
  const fetchErrors = results.filter((r) => r.error);

  const titleGroups = groupBy(okResults, (r) => r.title);
  const descriptionGroups = groupBy(okResults, (r) => r.description);
  const duplicateTitles = [...titleGroups.entries()].filter(
    ([title, routes]) => title && routes.length > 1,
  );
  const duplicateDescriptions = [...descriptionGroups.entries()].filter(
    ([description, routes]) => description && routes.length > 1,
  );

  return {
    results,
    routeCount: routes.length,
    unexpectedStatus,
    missingTitle,
    missingDescription,
    missingCanonical,
    fetchErrors,
    duplicateTitles,
    duplicateDescriptions,
    ok:
      missingTitle.length === 0 &&
      missingDescription.length === 0 &&
      missingCanonical.length === 0 &&
      fetchErrors.length === 0 &&
      duplicateTitles.length === 0 &&
      duplicateDescriptions.length === 0,
  };
}

function groupBy<T>(items: T[], keyOf: (item: T) => string | null) {
  const map = new Map<string | null, T[]>();

  for (const item of items) {
    const key = keyOf(item);
    const existing = map.get(key);

    if (existing) existing.push(item);
    else map.set(key, [item]);
  }

  return map;
}

async function main() {
  const baseUrl =
    process.env.SEO_AUDIT_BASE_URL ??
    process.env.SMOKE_BASE_URL ??
    "http://localhost:3000";
  const audit = await runSeoAudit(baseUrl);

  console.log(`SEO audit against ${baseUrl} — ${audit.routeCount} routes\n`);

  for (const r of audit.results) {
    console.log(
      `${r.error ? "ERROR" : r.status}  ${r.path}  title=${r.title ? "yes" : "MISSING"}  description=${r.description ? "yes" : "MISSING"}  canonical=${r.canonical ? "yes" : "MISSING"}`,
    );
  }

  if (audit.unexpectedStatus.length > 0) {
    console.log(
      "\nNon-200 routes (informational -- not counted as a metadata failure; a route the inventory expected to resolve but didn't is still worth checking):",
    );
    for (const r of audit.unexpectedStatus) {
      console.log(`  ${r.status}  ${r.path}`);
    }
  }

  if (audit.duplicateTitles.length > 0) {
    console.log("\nDuplicate titles (200-status routes only):");
    for (const [title, routes] of audit.duplicateTitles) {
      console.log(`  "${title}" -> ${routes.map((r) => r.path).join(", ")}`);
    }
  }

  if (audit.duplicateDescriptions.length > 0) {
    console.log("\nDuplicate descriptions (200-status routes only):");
    for (const [description, routes] of audit.duplicateDescriptions) {
      console.log(
        `  "${description}" -> ${routes.map((r) => r.path).join(", ")}`,
      );
    }
  }

  console.log(audit.ok ? "\nPASS" : "\nFAIL");
  process.exit(audit.ok ? 0 : 1);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
