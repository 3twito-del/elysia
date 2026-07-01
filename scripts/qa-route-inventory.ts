import { mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { getSeedProducts, seedCategories } from "../prisma/seed-catalog";
import { listFixtureBlogPosts } from "../src/server/services/blog-fixtures";
import { listFixtureCatalogProducts } from "../src/server/services/catalog-fixtures";

export type QaRouteCoverage = "documented" | "smoke" | "visual";
export type QaRouteKind =
  | "account"
  | "admin"
  | "api"
  | "dynamic"
  | "pwa"
  | "public";

export type QaRoute = {
  coverage: QaRouteCoverage;
  expectedStatuses: number[];
  includeInPerformance: boolean;
  includeInVisualQa: boolean;
  kind: QaRouteKind;
  liveMode: "read-only" | "staging-mutation";
  method: "GET" | "POST";
  notes: string;
  path: string;
  requiresAuth: boolean;
  source: string;
  template: string;
};

export type AppRouteTemplate = {
  kind: "api" | "page" | "state";
  source: string;
  template: string;
};

export type QaRouteInventoryCadenceEntry = {
  artifact: string;
  command: string;
  scope: "representative" | "all-products";
  when: string;
};

export const qaRouteInventoryCadence = [
  {
    artifact: "console PASS from the app-template coverage check",
    command: "pnpm qa:routes",
    scope: "representative",
    when: "Run on every route, navigation, middleware, API, or public shell change.",
  },
  {
    artifact: "artifacts/qa/<date>-route-inventory/route-inventory.{json,md}",
    command:
      "pnpm exec tsx scripts/qa-route-inventory.ts --check --all-products --out-dir artifacts/qa/<date>-route-inventory",
    scope: "all-products",
    when: "Run before production release when catalog routing, product fixture coverage, search, category filters, PDP rendering, or smoke route contracts changed.",
  },
] as const satisfies readonly QaRouteInventoryCadenceEntry[];

const staticPublicRoutes = [
  "/",
  "/search",
  "/search?q=venus",
  "/search?q=zzzz-no-match&maxPrice=1",
  "/gifts",
  "/wishlist",
  "/branches",
  "/checkout",
  "/account",
  "/account/invoices",
  "/ai",
  "/ai?tab=gifts",
  "/stylist",
  "/size-guide",
  "/size-guide?kind=ring",
  "/service",
  "/blog",
  "/about",
  "/faq",
  "/privacy",
  "/terms",
  "/accessibility",
  "/shipping-returns",
  "/warranty",
  "/jewellery-care",
  "/offline",
] as const;

const protectedAdminRoutes = [
  "/admin",
  "/admin/insights",
  "/admin/bi",
  "/admin/ai",
  "/admin/anomalies",
  "/admin/insights/live",
  "/admin/insights/replay",
  "/admin/insights/replay/[sessionId]",
  "/admin/crm",
  "/admin/blog",
  "/admin/pages",
  "/admin/experiments",
  "/admin/orders",
  "/admin/catalog",
  "/admin/promotions",
  "/admin/merchandising",
  "/admin/inventory",
  "/admin/reorder",
  "/admin/bins",
  "/admin/customers",
  "/admin/mdm",
  "/admin/b2b",
  "/admin/price-lists",
  "/admin/erp",
  "/admin/finance",
  "/admin/appointments",
  "/admin/integrations",
  "/admin/audit",
  "/admin/notifications",
  "/admin/service",
  "/admin/lms",
  "/admin/pos",
  "/admin/workspace",
  "/admin/operations",
  "/admin/performance",
  "/admin/projects",
  "/admin/workflow",
  "/admin/reports",
  "/admin/entities",
  "/admin/developer",
  "/admin/edi",
  "/admin/tax",
  "/admin/marketing",
] as const;

const documentedApiRoutes = [
  "/category/[slug]/filters",
  "/api/auth/[...nextauth]",
  "/api/trpc/[trpc]",
  "/api/push/preferences",
  "/api/push/subscribe",
  "/api/push/subscription",
  "/api/pwa/sync",
  "/api/pwa/sync/service-request",
  "/api/admin/insights/live",
  "/api/admin/tax/shaam",
  "/api/admin/tax/form856",
  "/api/admin/edi/[id]",
  "/api/analytics/replay",
  "/api/search/reindex",
  "/api/events/product-click",
  "/api/events/product-view",
  "/api/e2e/customer-auth",
  "/api/jobs/outbox",
  "/serwist/[path]",
] as const;

const smokeApiRoutes = [
  { method: "GET" as const, path: "/api/health", statuses: [200] },
  { method: "GET" as const, path: "/api/cart/count", statuses: [200] },
  { method: "GET" as const, path: "/api/wishlist/products", statuses: [200] },
  { method: "POST" as const, path: "/api/cart/items", statuses: [400] },
  { method: "GET" as const, path: "/account/privacy/export", statuses: [401] },
  { method: "POST" as const, path: "/api/chat", statuses: [400] },
  { method: "POST" as const, path: "/api/webhooks/cardcom", statuses: [401] },
  {
    method: "POST" as const,
    path: "/api/webhooks/cloudinary",
    statuses: [401, 400],
  },
  {
    method: "POST" as const,
    path: "/api/webhooks/shopify/orders",
    statuses: [401, 400],
  },
] as const;

const supplierFixtureProductSlugs = new Set([
  "elysia-supplier-silver-halo-ring",
]);

export function getQaRouteInventory({
  includeAllProducts = false,
}: {
  includeAllProducts?: boolean;
} = {}) {
  const entries: QaRoute[] = [];
  const representativeProductSlugs = getRepresentativeProductSlugs();
  const productSlugs = includeAllProducts
    ? getRouteInventoryProductSlugs()
    : representativeProductSlugs;

  for (const route of staticPublicRoutes) {
    entries.push(
      routeEntry({
        includeInPerformance: isPerformanceRoute(route),
        kind:
          route.startsWith("/account")
            ? "account"
            : route === "/offline"
              ? "pwa"
              : "public",
        path: route,
        source: "static-public",
        template: stripQuery(route),
      }),
    );
  }

  for (const category of seedCategories) {
    entries.push(
      routeEntry({
        includeInPerformance: category.slug === "earrings",
        kind: "dynamic",
        path: `/category/${category.slug}`,
        source: "seed-catalog",
        template: "/category/[slug]",
      }),
    );
  }

  entries.push(
    routeEntry({
      expectedStatuses: [404],
      kind: "dynamic",
      notes:
        "Intentional recovery-state route; visual QA should treat the public 404 response as expected when the page renders recovery content.",
      path: "/category/not-a-real-category",
      source: "recovery-state",
      template: "/category/[slug]",
    }),
  );

  for (const slug of productSlugs) {
    entries.push(
      routeEntry({
        includeInPerformance: slug === "elysia-mila-bracelet-silver-ii-093",
        kind: "dynamic",
        path: `/product/${slug}`,
        notes: getProductRouteNotes(slug),
        source: includeAllProducts
          ? "catalog-fixture-full"
          : "catalog-fixture-sample",
        template: "/product/[slug]",
      }),
    );
  }

  for (const post of listFixtureBlogPosts().slice(0, 1)) {
    entries.push(
      routeEntry({
        kind: "public",
        path: `/blog/${post.slug}`,
        source: "blog-fixture-sample",
        template: "/blog/[slug]",
      }),
    );
  }

  entries.push(
    routeEntry({
      kind: "account",
      path: "/account/orders/fixture-order",
      requiresAuth: true,
      source: "protected-dynamic",
      template: "/account/orders/[id]",
    }),
  );

  entries.push(
    routeEntry({
      kind: "public",
      path: "/vendor-portal/invalid-token",
      source: "token-gated-portal",
      template: "/vendor-portal/[token]",
    }),
  );

  entries.push(
    routeEntry({
      kind: "public",
      path: "/p/sample-landing",
      source: "cms-landing-page",
      template: "/p/[slug]",
    }),
  );

  entries.push(
    routeEntry({
      kind: "admin",
      path: "/admin/login",
      source: "admin-auth",
      template: "/admin/login",
    }),
  );

  entries.push(
    routeEntry({
      kind: "admin",
      path: "/admin/login?next=https://evil.example/admin",
      source: "admin-auth-sanitization",
      template: "/admin/login",
    }),
  );

  for (const route of protectedAdminRoutes) {
    entries.push(
      routeEntry({
        kind: "admin",
        path: route,
        requiresAuth: true,
        source: "protected-admin",
        template: route,
      }),
    );
  }

  entries.push(
    routeEntry({
      kind: "admin",
      path: "/admin/blog/fixture-post",
      requiresAuth: true,
      source: "protected-dynamic",
      template: "/admin/blog/[id]",
    }),
  );

  entries.push(
    routeEntry({
      kind: "admin",
      path: "/admin/customers/fixture-customer",
      requiresAuth: true,
      source: "protected-dynamic",
      template: "/admin/customers/[id]",
    }),
  );

  entries.push(
    routeEntry({
      kind: "admin",
      path: "/admin/orders/fixture-order",
      requiresAuth: true,
      source: "protected-dynamic",
      template: "/admin/orders/[id]",
    }),
  );

  entries.push(
    routeEntry({
      coverage: "documented",
      includeInVisualQa: false,
      kind: "api",
      method: "POST",
      notes:
        "Analytics batch ingestion endpoint; requires client consent context and structured event payload.",
      path: "/api/analytics/events",
      source: "documented-api",
      template: "/api/analytics/events",
    }),
  );

  for (const apiRoute of smokeApiRoutes) {
    entries.push(
      routeEntry({
        coverage: "smoke",
        expectedStatuses: [...apiRoute.statuses],
        includeInVisualQa: false,
        kind: "api",
        method: apiRoute.method,
        path: apiRoute.path,
        source: "api-smoke",
        template: apiRoute.path,
      }),
    );
  }

  for (const template of documentedApiRoutes) {
    entries.push(
      routeEntry({
        coverage: "documented",
        includeInVisualQa: false,
        kind: "api",
        notes:
          "Requires protocol-specific input, auth state, webhook signature, or service-worker asset handling.",
        path: template,
        source: "documented-api",
        template,
      }),
    );
  }

  return dedupeRoutes(entries);
}

export function getVisualQaRoutes(options?: { includeAllProducts?: boolean }) {
  return getVisualQaRouteEntries(options).map((route) => route.path);
}

export function getPerformanceQaRoutes() {
  return getPerformanceQaRouteEntries().map((route) => route.path);
}

export function getVisualQaRouteEntries(options?: {
  includeAllProducts?: boolean;
}) {
  return getQaRouteInventory(options).filter(
    (route) => route.includeInVisualQa,
  );
}

export function getPerformanceQaRouteEntries() {
  return getQaRouteInventory().filter((route) => route.includeInPerformance);
}

export function discoverAppRouteTemplates({
  appDir = path.join(process.cwd(), "src", "app"),
}: {
  appDir?: string;
} = {}) {
  const templates: AppRouteTemplate[] = [];

  walkAppDir(appDir, (filePath) => {
    const fileName = path.basename(filePath);
    if (
      ![
        "page.tsx",
        "route.ts",
        "loading.tsx",
        "error.tsx",
        "not-found.tsx",
      ].includes(fileName)
    ) {
      return;
    }

    const routeDir = path.dirname(path.relative(appDir, filePath));
    const template = normalizeAppTemplate(routeDir === "." ? "" : routeDir);
    const kind =
      fileName === "route.ts"
        ? "api"
        : fileName === "page.tsx"
          ? "page"
          : "state";

    templates.push({
      kind,
      source: path.relative(process.cwd(), filePath).replace(/\\/gu, "/"),
      template,
    });
  });

  return templates.sort((left, right) =>
    `${left.kind}:${left.template}:${left.source}`.localeCompare(
      `${right.kind}:${right.template}:${right.source}`,
    ),
  );
}

export function assertQaRouteInventoryCoverage() {
  const inventory = getQaRouteInventory({ includeAllProducts: true });
  const coveredTemplates = new Set(inventory.map((route) => route.template));
  const appTemplates = discoverAppRouteTemplates();
  const missing = appTemplates.filter(
    (template) =>
      template.kind !== "state" && !coveredTemplates.has(template.template),
  );

  return {
    appTemplates,
    inventory,
    missing,
    ok: missing.length === 0,
  };
}

export function createQaArtifactDir(label = "manual") {
  const stamp = new Date().toISOString().replace(/[:.]/gu, "-");
  const artifactDir = path.join(
    process.cwd(),
    "artifacts",
    "qa",
    `${stamp}-${label}`,
  );

  mkdirSync(artifactDir, { recursive: true });

  return artifactDir;
}

export function writeRouteInventoryArtifacts({
  artifactDir,
  includeAllProducts = true,
}: {
  artifactDir: string;
  includeAllProducts?: boolean;
}) {
  const coverage = assertQaRouteInventoryCoverage();
  const inventory = getQaRouteInventory({ includeAllProducts });
  const payload = {
    appTemplates: coverage.appTemplates,
    generatedAt: new Date().toISOString(),
    inventory,
    missing: coverage.missing,
    ok: coverage.ok,
  };

  mkdirSync(artifactDir, { recursive: true });
  writeFileSync(
    path.join(artifactDir, "route-inventory.json"),
    `${JSON.stringify(payload, null, 2)}\n`,
  );
  writeFileSync(
    path.join(artifactDir, "route-inventory.md"),
    formatRouteInventoryMarkdown(payload),
  );

  return payload;
}

function routeEntry(input: {
  coverage?: QaRouteCoverage;
  expectedStatuses?: number[];
  includeInPerformance?: boolean;
  includeInVisualQa?: boolean;
  kind: QaRouteKind;
  liveMode?: "read-only" | "staging-mutation";
  method?: "GET" | "POST";
  notes?: string;
  path: string;
  requiresAuth?: boolean;
  source: string;
  template: string;
}): QaRoute {
  return {
    coverage: input.coverage ?? "visual",
    expectedStatuses: input.expectedStatuses ?? [200, 302, 303, 307, 308],
    includeInPerformance: input.includeInPerformance ?? false,
    includeInVisualQa: input.includeInVisualQa ?? true,
    kind: input.kind,
    liveMode: input.liveMode ?? "read-only",
    method: input.method ?? "GET",
    notes: input.notes ?? "",
    path: input.path,
    requiresAuth: input.requiresAuth ?? false,
    source: input.source,
    template: input.template,
  };
}

function getRepresentativeProductSlugs() {
  const products = listFixtureCatalogProducts();
  const important = [
    "elysia-mila-bracelet-silver-ii-093",
    "elysia-mira-earrings-silver-072",
    "elysia-vera-necklace-silver-050",
    "elysia-supplier-silver-halo-ring",
  ];
  const firstByCategory = seedCategories
    .map(
      (category) =>
        products.find((product) => product.categorySlug === category.slug)
          ?.slug,
    )
    .filter((slug): slug is string => Boolean(slug));

  return Array.from(new Set([...important, ...firstByCategory]));
}

function getRouteInventoryProductSlugs() {
  return Array.from(
    new Set([
      ...getSeedProducts().map((product) => product.slug),
      ...listFixtureCatalogProducts().map((product) => product.slug),
    ]),
  );
}

function getProductRouteNotes(slug: string) {
  if (!supplierFixtureProductSlugs.has(slug)) return "";

  return "Supplier fixture route; local visual QA requires E2E_CATALOG_FIXTURES=1 or an active database-backed supplier product with this slug.";
}

function isPerformanceRoute(route: string) {
  return [
    "/",
    "/search?q=venus",
    "/category/earrings",
    "/product/elysia-mila-bracelet-silver-ii-093",
    "/checkout",
    "/account",
    "/ai",
    "/service",
  ].includes(route);
}

function dedupeRoutes(routes: QaRoute[]) {
  const seen = new Set<string>();

  return routes.filter((route) => {
    const key = `${route.method}:${route.path}:${route.template}:${route.coverage}`;

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function stripQuery(route: string) {
  return route.split("?")[0] ?? "/";
}

function walkAppDir(dir: string, visit: (filePath: string) => void) {
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      if (entry.startsWith("_")) continue;
      walkAppDir(fullPath, visit);
      continue;
    }

    if (stats.isFile()) visit(fullPath);
  }
}

function normalizeAppTemplate(relativeDir: string) {
  const segments = relativeDir
    .split(path.sep)
    .filter(Boolean)
    .filter((segment) => !segment.startsWith("(") || !segment.endsWith(")"));

  if (segments.length === 0) return "/";

  return `/${segments.join("/")}`;
}

function formatRouteInventoryMarkdown(payload: {
  appTemplates: AppRouteTemplate[];
  generatedAt: string;
  inventory: QaRoute[];
  missing: AppRouteTemplate[];
  ok: boolean;
}) {
  const lines = [
    "# QA Route Inventory",
    "",
    `Generated: ${payload.generatedAt}`,
    `Status: ${payload.ok ? "PASS" : "FAIL"}`,
    "",
    "## Browser-visible Routes",
    "",
    "| Method | Path | Template | Kind | Coverage | Auth | Source | Notes |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ...payload.inventory
      .filter((route) => route.includeInVisualQa)
      .map(
        (route) =>
          `| ${route.method} | \`${route.path}\` | \`${route.template}\` | ${route.kind} | ${route.coverage} | ${route.requiresAuth ? "yes" : "no"} | ${route.source} | ${route.notes || "-"} |`,
      ),
    "",
    "## Route Inventory Cadence",
    "",
    "| Scope | Command | When | Expected Artifact |",
    "| --- | --- | --- | --- |",
    ...qaRouteInventoryCadence.map(
      (entry) =>
        `| ${entry.scope} | \`${entry.command}\` | ${entry.when} | ${entry.artifact} |`,
    ),
    "",
    "## Documented/API Routes",
    "",
    "| Method | Path | Template | Coverage | Notes |",
    "| --- | --- | --- | --- | --- |",
    ...payload.inventory
      .filter((route) => !route.includeInVisualQa)
      .map(
        (route) =>
          `| ${route.method} | \`${route.path}\` | \`${route.template}\` | ${route.coverage} | ${route.notes || "-"} |`,
      ),
    "",
    "## Missing App Templates",
    "",
    ...(payload.missing.length === 0
      ? ["None."]
      : payload.missing.map(
          (route) =>
            `- ${route.kind} \`${route.template}\` from \`${route.source}\``,
        )),
    "",
  ];

  return `${lines.join("\n")}\n`;
}

function printHelp() {
  console.log(`QA route inventory

Usage:
  pnpm exec tsx scripts/qa-route-inventory.ts [options]

Options:
  --check              Fail when an app route template has no inventory entry.
  --json               Print full route inventory as JSON.
  --markdown           Print route inventory as markdown.
  --visual-routes      Print browser-visible route paths, one per line.
  --performance-routes Print performance-audited route paths, one per line.
  --all-products       Include every seeded product route.
                       Use before production releases that affect catalog routing.
  --out-dir <path>     Write route-inventory.json and route-inventory.md.
`);
}

async function main(argv = process.argv.slice(2)) {
  const includeAllProducts = argv.includes("--all-products");
  const outDirIndex = argv.indexOf("--out-dir");
  const outDir = outDirIndex >= 0 ? argv[outDirIndex + 1] : "";

  if (argv.includes("--help") || argv.includes("-h")) {
    printHelp();
    return;
  }

  if (outDir) {
    writeRouteInventoryArtifacts({ artifactDir: outDir, includeAllProducts });
  }

  if (argv.includes("--check")) {
    const result = assertQaRouteInventoryCoverage();

    if (!result.ok) {
      console.error("QA route inventory is missing app route templates:");
      for (const route of result.missing) {
        console.error(`- ${route.kind} ${route.template} (${route.source})`);
      }
      process.exitCode = 1;
    } else {
      console.log(
        `QA route inventory covers ${result.appTemplates.length} app route template(s).`,
      );
    }
  }

  if (argv.includes("--visual-routes")) {
    console.log(getVisualQaRoutes({ includeAllProducts }).join("\n"));
    return;
  }

  if (argv.includes("--performance-routes")) {
    console.log(getPerformanceQaRoutes().join("\n"));
    return;
  }

  if (argv.includes("--markdown")) {
    const payload = {
      appTemplates: discoverAppRouteTemplates(),
      generatedAt: new Date().toISOString(),
      inventory: getQaRouteInventory({ includeAllProducts }),
      missing: assertQaRouteInventoryCoverage().missing,
      ok: assertQaRouteInventoryCoverage().ok,
    };

    console.log(formatRouteInventoryMarkdown(payload));
    return;
  }

  if (argv.includes("--json")) {
    console.log(
      JSON.stringify(getQaRouteInventory({ includeAllProducts }), null, 2),
    );
  }
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
