import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  hashApiKey,
  isKeyExpired,
  maskApiKey,
  parseKeyPrefix,
  validateScopes,
} from "./api-keys";

describe("hashApiKey", () => {
  it("is deterministic and 64 hex chars", () => {
    const hash = hashApiKey("elys_abcd_secret");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashApiKey("elys_abcd_secret")).toBe(hash);
    expect(hashApiKey("other")).not.toBe(hash);
  });
});

describe("maskApiKey / parseKeyPrefix", () => {
  it("masks a prefix", () => {
    expect(maskApiKey("abcd1234")).toBe("elys_abcd1234_••••••••");
  });

  it("extracts the prefix from a plaintext key", () => {
    expect(parseKeyPrefix("elys_abcd1234_deadbeef")).toBe("abcd1234");
    expect(parseKeyPrefix("bogus")).toBeNull();
    expect(parseKeyPrefix("nope_x")).toBeNull();
  });
});

describe("validateScopes", () => {
  it("requires at least one scope", () => {
    expect(validateScopes([])).toEqual(["יש לבחור לפחות הרשאה אחת."]);
  });

  it("rejects unknown scopes", () => {
    expect(validateScopes(["orders:read", "danger:all"])).toEqual([
      "הרשאה לא מוכרת: danger:all.",
    ]);
  });

  it("accepts known scopes", () => {
    expect(validateScopes(["orders:read", "catalog:read"])).toEqual([]);
  });
});

describe("isKeyExpired", () => {
  const now = new Date("2026-06-27T00:00:00Z");

  it("treats null as never expiring", () => {
    expect(isKeyExpired(null, now)).toBe(false);
  });

  it("compares against now", () => {
    expect(isKeyExpired(new Date("2026-06-26T00:00:00Z"), now)).toBe(true);
    expect(isKeyExpired(new Date("2026-06-28T00:00:00Z"), now)).toBe(false);
  });
});

describe("K-14 audit coverage", () => {
  it("issues and revokes keys inside a transaction that writes an AuditLog row", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/server/services/api-keys.ts"),
      "utf8",
    );

    for (const operation of ["issueApiKey", "revokeApiKey"]) {
      const start = source.indexOf(`export async function ${operation}`);
      const next = source.indexOf("\nexport async function ", start + 1);

      expect(start).toBeGreaterThanOrEqual(0);

      const body = source.slice(start, next === -1 ? source.length : next);

      expect(body).toContain("db.$transaction");
      expect(body).toContain("writeAdminAudit");
    }
  });
});
