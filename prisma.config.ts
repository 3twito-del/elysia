import { defineConfig } from "prisma/config";
import { existsSync, readFileSync } from "node:fs";

const envValues = new Map<string, string>();

for (const filename of [".env", ".env.local", ".env.development.local"]) {
  if (!existsSync(filename)) continue;

  for (const line of readFileSync(filename, "utf8").split(/\r?\n/u)) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)?\s*$/u.exec(line);

    if (!match?.[1]) continue;

    envValues.set(match[1], parseEnvValue(match[2] ?? ""));
  }
}

for (const [key, value] of envValues) {
  process.env[key] ??= value;
}

function parseEnvValue(value: string) {
  const trimmed = value.trim();
  const quoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"));

  return quoted ? trimmed.slice(1, -1) : trimmed;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
