import { pathToFileURL } from "node:url";

export const protectedAdminPaths = [
  "/admin",
  "/admin/orders",
  "/admin/catalog",
  "/admin/inventory",
  "/admin/customers",
  "/admin/appointments",
  "/admin/integrations",
  "/admin/audit",
];

const categoryPaths = [
  "/category/rings",
  "/category/necklaces",
  "/category/earrings",
  "/category/bracelets",
];

const publicRouteChecks = [
  {
    path: "/",
    statuses: [200],
    includes: [
      "Elysia",
      'data-testid="home-commerce-shortcuts"',
      'href="/search"',
      'href="/gifts"',
      'href="/size-guide"',
      'href="/service"',
    ],
    matches: [
      /href="\/category\/rings"/,
      /href="\/checkout"/,
      /href="\/account"/,
    ],
  },
  {
    path: "/branches",
    statuses: [200, 307],
    includesAnywhere: ["/service"],
  },
  {
    path: "/gifts",
    statuses: [200],
    includes: ["Elysia"],
    matches: [/href="\/product\//],
  },
  { path: "/ai", statuses: [200], includes: ["Elysia"] },
  {
    path: "/ai?tab=gifts",
    statuses: [200],
    includes: ["Elysia", 'id="ai-gifts"'],
  },
  { path: "/stylist", statuses: [200], includes: ["Elysia"] },
  { path: "/about", statuses: [200], includes: ["Elysia"] },
  { path: "/faq", statuses: [200], includes: ["Elysia"] },
  { path: "/privacy", statuses: [200], includes: ["Elysia"] },
  { path: "/terms", statuses: [200], includes: ["Elysia"] },
  { path: "/accessibility", statuses: [200], includes: ["Elysia"] },
];

const categoryNavigationChecks = categoryPaths.map((path) => ({
  path,
  statuses: [200],
  includes: [
    'data-testid="category-results-grid"',
    'data-testid="product-card"',
  ],
  matches: [/href="\/product\//],
}));

export const smokeChecks = [
  {
    path: "/api/health",
    statuses: [200],
    includes: ['"ok":true', '"timestamp"'],
  },
  ...publicRouteChecks,
  {
    path: "/search",
    statuses: [200],
    includes: ['data-testid="search-form"'],
  },
  {
    path: "/search?q=venus",
    statuses: [200],
    includes: [
      'data-testid="search-form"',
      'data-testid="search-results-grid"',
    ],
    matches: [/href="\/product\//],
  },
  {
    path: "/search?q=zzzz-no-match&maxPrice=1",
    statuses: [200],
    includes: ['data-testid="search-empty-state"', 'data-testid="search-form"'],
  },
  ...categoryNavigationChecks,
  {
    path: "/product/elysia-supplier-silver-halo-ring",
    statuses: [200],
    includes: [
      "elysia-supplier-silver-halo-ring",
      'data-testid="product-gallery"',
      'data-testid="product-variant-feedback"',
      'data-testid="product-recommendation-rails"',
    ],
    matches: [/href="\/category\//],
  },
  {
    path: "/checkout",
    statuses: [200],
    includes: [
      'id="checkout-form"',
      'id="checkout-service"',
      'data-testid="cart-checkout-form"',
    ],
    matches: [/href="\/category\//],
  },
  {
    path: "/account",
    statuses: [200],
    includes: [
      'data-testid="account-otp-request-form"',
      'data-testid="account-identifier-input"',
      'id="identifier"',
    ],
  },
  {
    path: "/account/privacy/export",
    statuses: [401],
    includes: ['"ok":false', '"error":"Unauthorized."'],
  },
  {
    path: "/api/chat",
    method: "POST",
    body: "",
    statuses: [400],
    includes: ['"ok":false', '"error":"Invalid request body."'],
  },
  {
    path: "/api/cart/items",
    method: "POST",
    body: "{}",
    statuses: [400],
    includes: ['"ok":false'],
  },
  {
    path: "/api/webhooks/cardcom",
    method: "POST",
    body: "{}",
    statuses: [401],
    includes: ['"ok":false', '"error":"Invalid signature."'],
  },
  {
    path: "/admin/login?next=https://evil.example/admin",
    statuses: [200],
    includes: ['name="next"', 'value="/admin"', 'id="email"'],
  },
  ...protectedAdminPaths.map((path) => ({
    path,
    statuses: [200, 302, 303, 307, 308],
    includesAnywhere: ["/admin/login"],
    matchesAnywhere: [/next=(?:\/admin|%2Fadmin)/],
  })),
];

export function createSmokeCheckUrl(baseUrl, path) {
  const root = baseUrl.replace(/\/+$/u, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;

  return `${root}${suffix}`;
}

export async function runSmokeChecks({
  baseUrl = process.env.SMOKE_BASE_URL ?? "http://localhost:3002",
  checks = smokeChecks,
  fetchImpl = fetch,
  logger = console.log,
} = {}) {
  let failed = false;
  const results = [];

  for (const check of checks) {
    const response = await fetchImpl(createSmokeCheckUrl(baseUrl, check.path), {
      body: check.body,
      method: check.method ?? "GET",
      redirect: "manual",
    });
    const body = await response.text();
    const result = evaluateSmokeCheck(check, {
      body,
      headers: response.headers,
      status: response.status,
    });

    results.push(result);
    logger(formatSmokeResult(result));

    if (!result.ok) failed = true;
  }

  return { failed, results };
}

export function evaluateSmokeCheck(check, response) {
  const statusOk = check.statuses.includes(response.status);
  const body = response.body ?? "";
  const location = getHeader(response.headers, "location");
  const anywhere = `${location}\n${body}`;
  const missingBodyIncludes = (check.includes ?? []).filter(
    (expected) => !body.includes(expected),
  );
  const missingBodyMatches = (check.matches ?? []).filter(
    (expected) => !expected.test(body),
  );
  const missingAnywhereIncludes = (check.includesAnywhere ?? []).filter(
    (expected) => !anywhere.includes(expected),
  );
  const missingAnywhereMatches = (check.matchesAnywhere ?? []).filter(
    (expected) => !expected.test(anywhere),
  );
  const missing = [
    ...missingBodyIncludes.map((value) => `body:${JSON.stringify(value)}`),
    ...missingBodyMatches.map((value) => `body:${value}`),
    ...missingAnywhereIncludes.map(
      (value) => `body-or-location:${JSON.stringify(value)}`,
    ),
    ...missingAnywhereMatches.map((value) => `body-or-location:${value}`),
  ];

  if (!statusOk) {
    missing.unshift(`status:${response.status}`);
  }

  return {
    location,
    missing,
    ok: statusOk && missing.length === 0,
    path: check.path,
    status: response.status,
  };
}

export function formatSmokeResult(result) {
  const locationSuffix = result.location ? ` location=${result.location}` : "";
  const missingSuffix =
    result.missing.length > 0 ? ` missing ${result.missing.join(", ")}` : "";

  return `${result.ok ? "PASS" : "FAIL"} ${result.path} -> ${result.status}${locationSuffix}${missingSuffix}`;
}

function getHeader(headers, name) {
  if (!headers) return "";

  if (typeof headers.get === "function") {
    return headers.get(name) ?? "";
  }

  return headers[name] ?? headers[name.toLowerCase()] ?? "";
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const { failed } = await runSmokeChecks();

  if (failed) {
    process.exitCode = 1;
  }
}
