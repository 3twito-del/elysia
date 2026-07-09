-- ADR 0004 (docs/DECISIONS.md): immutability enforced below the service layer.
-- Evidentiary tables are append-only at the database level: application bugs,
-- ORM misuse, console edits, and future code paths that forget the rule are
-- all blocked. Corrections are new rows / reversals, never edits.
--
-- Escape hatch (deliberate, transaction-scoped, leaves no standing hole):
--   SET LOCAL elysia.allow_protected_mutation = 'on';
-- Used only by dev seeding (prisma/seed.ts) and explicit, documented
-- maintenance. A hostile DBA is explicitly out of scope for this control
-- (dropping triggers leaves DDL evidence) — see ADR 0004.
--
-- Side effect to be aware of: FK actions that would UPDATE or DELETE rows in
-- protected tables (e.g. cascading a Customer delete into ConsentRecord, or
-- an AdminUser delete SET NULL-ing AuditLog.adminUserId) now fail. That is
-- intentional: evidence outlives its actor. No live code path performs such
-- deletes today (verified 2026-07-08).

CREATE OR REPLACE FUNCTION elysia_block_protected_mutation()
RETURNS trigger AS $$
BEGIN
  IF current_setting('elysia.allow_protected_mutation', true) = 'on' THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;
  RAISE EXCEPTION
    'ELYSIA_IMMUTABLE: "%" is append-only; % is not allowed. Corrections are new rows / reversals (ADR 0004).',
    TG_TABLE_NAME, TG_OP;
END;
$$ LANGUAGE plpgsql;

-- Fully immutable set: no UPDATE, no DELETE.
DROP TRIGGER IF EXISTS "AuditLog_immutable" ON "AuditLog";
CREATE TRIGGER "AuditLog_immutable"
  BEFORE UPDATE OR DELETE ON "AuditLog"
  FOR EACH ROW EXECUTE FUNCTION elysia_block_protected_mutation();

DROP TRIGGER IF EXISTS "JournalLine_immutable" ON "JournalLine";
CREATE TRIGGER "JournalLine_immutable"
  BEFORE UPDATE OR DELETE ON "JournalLine"
  FOR EACH ROW EXECUTE FUNCTION elysia_block_protected_mutation();

DROP TRIGGER IF EXISTS "InventoryLedger_immutable" ON "InventoryLedger";
CREATE TRIGGER "InventoryLedger_immutable"
  BEFORE UPDATE OR DELETE ON "InventoryLedger"
  FOR EACH ROW EXECUTE FUNCTION elysia_block_protected_mutation();

DROP TRIGGER IF EXISTS "ConsentRecord_immutable" ON "ConsentRecord";
CREATE TRIGGER "ConsentRecord_immutable"
  BEFORE UPDATE OR DELETE ON "ConsentRecord"
  FOR EACH ROW EXECUTE FUNCTION elysia_block_protected_mutation();

DROP TRIGGER IF EXISTS "LoyaltyTransaction_immutable" ON "LoyaltyTransaction";
CREATE TRIGGER "LoyaltyTransaction_immutable"
  BEFORE UPDATE OR DELETE ON "LoyaltyTransaction"
  FOR EACH ROW EXECUTE FUNCTION elysia_block_protected_mutation();

-- JournalEntry: column-restricted. The only permitted mutation is the
-- reversal transition POSTED -> REVERSED; during that transition only
-- status (and reversal metadata) may change. DELETE always raises.
-- Explicitly excluded by design (ADR 0004): OutboxEvent (operational state
-- machine) and ItemCostLayer (working valuation table; the immutable truth
-- is LandedCost + the GL entry + AuditLog).
CREATE OR REPLACE FUNCTION elysia_guard_journal_entry()
RETURNS trigger AS $$
BEGIN
  IF current_setting('elysia.allow_protected_mutation', true) = 'on' THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION
      'ELYSIA_IMMUTABLE: JournalEntry rows cannot be deleted; post a reversal entry instead (ADR 0004).';
  END IF;
  IF NOT (OLD.status = 'POSTED' AND NEW.status = 'REVERSED') THEN
    RAISE EXCEPTION
      'ELYSIA_IMMUTABLE: JournalEntry may only transition POSTED -> REVERSED (attempted % -> %).',
      OLD.status, NEW.status;
  END IF;
  IF NEW."id" IS DISTINCT FROM OLD."id"
     OR NEW."entryNumber" IS DISTINCT FROM OLD."entryNumber"
     OR NEW."entryDate" IS DISTINCT FROM OLD."entryDate"
     OR NEW."memo" IS DISTINCT FROM OLD."memo"
     OR NEW."source" IS DISTINCT FROM OLD."source"
     OR NEW."currency" IS DISTINCT FROM OLD."currency"
     OR NEW."aggregateType" IS DISTINCT FROM OLD."aggregateType"
     OR NEW."aggregateId" IS DISTINCT FROM OLD."aggregateId"
     OR NEW."orderId" IS DISTINCT FROM OLD."orderId"
     OR NEW."purchaseOrderId" IS DISTINCT FROM OLD."purchaseOrderId"
     OR NEW."reversalOfId" IS DISTINCT FROM OLD."reversalOfId"
     OR NEW."postedById" IS DISTINCT FROM OLD."postedById"
     OR NEW."entityId" IS DISTINCT FROM OLD."entityId"
     OR NEW."createdAt" IS DISTINCT FROM OLD."createdAt"
  THEN
    RAISE EXCEPTION
      'ELYSIA_IMMUTABLE: JournalEntry fields are immutable; only status/metadata may change during the reversal transition (ADR 0004).';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "JournalEntry_guard" ON "JournalEntry";
CREATE TRIGGER "JournalEntry_guard"
  BEFORE UPDATE OR DELETE ON "JournalEntry"
  FOR EACH ROW EXECUTE FUNCTION elysia_guard_journal_entry();
