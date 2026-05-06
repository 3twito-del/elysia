const baseUrl = process.env.SMOKE_BASE_URL ?? "http://localhost:3002";

const checks = [
  { path: "/", statuses: [200], includes: ["Aphrodite"] },
  { path: "/branches", statuses: [200], includes: ["Aphrodite"] },
  { path: "/search", statuses: [200], includes: ['data-testid="search-form"'] },
  {
    path: "/search?q=zzzz-no-match&maxPrice=1",
    statuses: [200],
    includes: ['data-testid="search-empty-state"', 'data-testid="search-form"'],
  },
  {
    path: "/category/earrings",
    statuses: [200],
    includes: [
      'data-testid="category-results-grid"',
      'data-testid="product-card"',
    ],
  },
  {
    path: "/checkout",
    statuses: [200],
    includes: ['data-testid="cart-checkout-form"'],
  },
  {
    path: "/product/venus-line-ring",
    statuses: [200],
    includes: ["venus-line-ring"],
  },
  { path: "/account", statuses: [200] },
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
  { path: "/admin", statuses: [200, 302, 303, 307, 308] },
  {
    path: "/admin/login?next=https://evil.example/admin",
    statuses: [200],
    includes: ['name="next"', 'value="/admin"', "Back office"],
  },
];

let failed = false;

for (const check of checks) {
  const response = await fetch(`${baseUrl}${check.path}`, {
    body: check.body,
    method: check.method ?? "GET",
    redirect: "manual",
  });
  const statusOk = check.statuses.includes(response.status);
  const body = statusOk && check.includes?.length ? await response.text() : "";
  const contentOk =
    check.includes?.every((expected) => body.includes(expected)) ?? true;
  const ok = statusOk && contentOk;
  const contentSuffix = contentOk
    ? ""
    : ` missing ${check.includes
        .filter((expected) => !body.includes(expected))
        .map((expected) => JSON.stringify(expected))
        .join(", ")}`;

  console.log(
    `${ok ? "PASS" : "FAIL"} ${check.path} -> ${response.status}${contentSuffix}`,
  );

  if (!ok) failed = true;
}

if (failed) {
  process.exitCode = 1;
}
