const baseUrl = process.env.SMOKE_BASE_URL ?? "http://localhost:3002";

const checks = [
  { path: "/", statuses: [200] },
  { path: "/branches", statuses: [200] },
  { path: "/search", statuses: [200] },
  { path: "/checkout", statuses: [200] },
  { path: "/product/venus-line-ring", statuses: [200] },
  { path: "/account", statuses: [200] },
  { path: "/admin", statuses: [200, 302, 303, 307, 308] },
];

let failed = false;

for (const check of checks) {
  const response = await fetch(`${baseUrl}${check.path}`, {
    redirect: "manual",
  });
  const ok = check.statuses.includes(response.status);

  console.log(
    `${ok ? "PASS" : "FAIL"} ${check.path} -> ${response.status}`,
  );

  if (!ok) failed = true;
}

if (failed) {
  process.exitCode = 1;
}
