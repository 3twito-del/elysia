import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

loadLocalEnv(process.cwd());

function getArgValue(argv: string[], name: string) {
  const index = argv.indexOf(name);

  return index >= 0 ? argv[index + 1] : undefined;
}

function loadLocalEnv(cwd: string) {
  const values = new Map<string, string>();

  for (const filename of [".env", ".env.local", ".env.development.local"]) {
    const filePath = resolve(cwd, filename);
    if (!existsSync(filePath)) continue;

    for (const line of readFileSync(filePath, "utf8").split(/\r?\n/u)) {
      const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)?\s*$/u.exec(line);
      if (!match?.[1]) continue;

      values.set(match[1], parseEnvValue(match[2] ?? ""));
    }
  }

  for (const [key, value] of values) {
    process.env[key] ??= value;
  }
}

function parseEnvValue(value: string) {
  const trimmed = value.trim();
  const quoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"));

  return quoted ? trimmed.slice(1, -1) : trimmed;
}

async function main(argv = process.argv.slice(2)) {
  const { createShopifyDropshipImportPlan, syncShopifyDropshipCatalog } =
    await import("../src/server/services/shopify-dropship-sync");
  const first = Number(getArgValue(argv, "--first") ?? "50");
  const supplierKey = getArgValue(argv, "--supplier-key") ?? "shopify-dropship";
  const write = argv.includes("--write");

  if (write) {
    const result = await syncShopifyDropshipCatalog({ first, supplierKey });

    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const plan = await createShopifyDropshipImportPlan({ first, supplierKey });

  console.log(
    JSON.stringify(
      {
        mode: "dry-run",
        products: plan.products.length,
        skipped: plan.skipped.length,
        handles: plan.products.map((product) => product.externalHandle),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
