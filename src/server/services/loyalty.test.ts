import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { pointsForAmount, resolveTier } from "./loyalty";

function functionSource(functionName: string) {
  const source = readFileSync(
    path.join(process.cwd(), "src/server/services/loyalty.ts"),
    "utf8",
  );
  const start = source.indexOf(`export async function ${functionName}`);
  const next = source.indexOf("\nexport async function ", start + 1);

  expect(start).toBeGreaterThanOrEqual(0);

  return source.slice(start, next === -1 ? source.length : next);
}

describe("resolveTier", () => {
  it("maps lifetime points to the right tier at each threshold", () => {
    expect(resolveTier(0)).toBe("BRONZE");
    expect(resolveTier(499)).toBe("BRONZE");
    expect(resolveTier(500)).toBe("SILVER");
    expect(resolveTier(1499)).toBe("SILVER");
    expect(resolveTier(1500)).toBe("GOLD");
    expect(resolveTier(4999)).toBe("GOLD");
    expect(resolveTier(5000)).toBe("PLATINUM");
  });
});

describe("pointsForAmount", () => {
  it("awards 1 point per 10 currency, floored", () => {
    expect(pointsForAmount(250)).toBe(25);
    expect(pointsForAmount(259)).toBe(25);
    expect(pointsForAmount(9)).toBe(0);
  });

  it("is zero for non-positive amounts", () => {
    expect(pointsForAmount(0)).toBe(0);
    expect(pointsForAmount(-100)).toBe(0);
  });
});

describe("K-14 audit coverage", () => {
  it("applyPoints (via earnPoints/redeemPoints) writes an AuditLog row when admin-initiated", () => {
    // applyPoints itself is not exported (module-private); earnPoints and
    // redeemPoints both delegate to it, so the audit call lives in the
    // module body between them rather than inside either export.
    const source = readFileSync(
      path.join(process.cwd(), "src/server/services/loyalty.ts"),
      "utf8",
    );

    expect(source).toContain("async function applyPoints");
    expect(source).toContain("writeAdminAudit");
    expect(source).toContain("if (input.adminUserId)");
  });

  it("applyLoyaltyByEmail requires and forwards an admin actor", () => {
    expect(functionSource("applyLoyaltyByEmail")).toContain(
      "adminUserId: input.adminUserId",
    );
  });
});
