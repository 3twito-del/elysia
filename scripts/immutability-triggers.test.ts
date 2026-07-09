import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

const migration = read(
  "prisma/migrations/20260708140000_immutability_triggers/migration.sql",
);

describe("ADR 0004 immutability triggers", () => {
  it("covers the full protected set with BEFORE UPDATE OR DELETE row triggers", () => {
    for (const table of [
      "AuditLog",
      "JournalLine",
      "InventoryLedger",
      "ConsentRecord",
      "LoyaltyTransaction",
    ]) {
      expect(migration).toContain(`CREATE TRIGGER "${table}_immutable"`);
      expect(migration).toContain(`BEFORE UPDATE OR DELETE ON "${table}"`);
    }
    expect(migration).toContain(
      "EXECUTE FUNCTION elysia_block_protected_mutation()",
    );
  });

  it("restricts JournalEntry to the POSTED -> REVERSED transition only", () => {
    expect(migration).toContain('CREATE TRIGGER "JournalEntry_guard"');
    expect(migration).toContain(
      "OLD.status = 'POSTED' AND NEW.status = 'REVERSED'",
    );
    for (const column of [
      "entryNumber",
      "entryDate",
      "source",
      "currency",
      "aggregateType",
      "aggregateId",
      "orderId",
      "purchaseOrderId",
      "reversalOfId",
      "postedById",
      "entityId",
      "createdAt",
    ]) {
      expect(migration).toContain(
        `NEW."${column}" IS DISTINCT FROM OLD."${column}"`,
      );
    }
  });

  it("documents the declared exclusions instead of silently widening them", () => {
    expect(migration).toContain("OutboxEvent");
    expect(migration).toContain("ItemCostLayer");
    expect(migration).not.toContain('ON "OutboxEvent"');
    expect(migration).not.toContain('ON "ItemCostLayer"');
  });

  it("keeps the dev-seed escape hatch transaction-scoped", () => {
    expect(migration).toContain(
      "current_setting('elysia.allow_protected_mutation', true)",
    );
    const seed = read("prisma/seed.ts");
    expect(seed).toContain(
      "SET LOCAL elysia.allow_protected_mutation = 'on'",
    );
    const verification = read("scripts/verify-immutability-triggers.sql");
    expect(verification).toContain("ROLLBACK;");
    const packageJson = read("package.json");
    expect(packageJson).toContain(
      "prisma db execute --schema prisma/schema.prisma --file scripts/verify-immutability-triggers.sql",
    );
  });
});
