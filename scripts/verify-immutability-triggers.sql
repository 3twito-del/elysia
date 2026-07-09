-- ADR 0004 verification (docs/DECISIONS.md): proves the immutability triggers
-- exist AND behave — each blocked mutation raises, each permitted transition
-- succeeds. Run with:
--   pnpm db:verify:immutability
-- Everything runs inside one transaction that is always rolled back; no
-- scratch data survives. Fails loudly (non-zero exit) on any violation.

BEGIN;

DO $$
DECLARE
  protected_tables text[] := ARRAY[
    'AuditLog', 'JournalLine', 'InventoryLedger', 'ConsentRecord', 'LoyaltyTransaction'
  ];
  t text;
  trigger_count int;
  scratch_customer_id text := 'verify-immutability-customer';
  scratch_loyalty_id text := 'verify-immutability-loyalty';
  scratch_account_id text := 'verify-immutability-account';
  scratch_entry_id text := 'verify-immutability-entry';
  scratch_entry2_id text := 'verify-immutability-entry-2';
  scratch_line_id text := 'verify-immutability-line';
  scratch_audit_id text := 'verify-immutability-audit';
  scratch_consent_id text := 'verify-immutability-consent';
  scratch_loyalty_txn_id text := 'verify-immutability-loyalty-txn';
  blocked boolean;
  existing_inventory_ledger_id text;
BEGIN
  -- 1. Triggers exist on every protected table.
  FOREACH t IN ARRAY protected_tables LOOP
    SELECT count(*) INTO trigger_count
    FROM pg_trigger tr
    JOIN pg_class c ON c.oid = tr.tgrelid
    WHERE c.relname = t AND tr.tgname = t || '_immutable' AND NOT tr.tgisinternal;
    IF trigger_count <> 1 THEN
      RAISE EXCEPTION 'VERIFY FAILED: missing immutability trigger on "%"', t;
    END IF;
  END LOOP;
  SELECT count(*) INTO trigger_count
  FROM pg_trigger tr
  JOIN pg_class c ON c.oid = tr.tgrelid
  WHERE c.relname = 'JournalEntry' AND tr.tgname = 'JournalEntry_guard' AND NOT tr.tgisinternal;
  IF trigger_count <> 1 THEN
    RAISE EXCEPTION 'VERIFY FAILED: missing JournalEntry_guard trigger';
  END IF;
  RAISE NOTICE 'OK: all immutability triggers exist';

  -- 2. Scratch graph (rolled back at the end).
  INSERT INTO "Customer" ("id", "email", "updatedAt")
    VALUES (scratch_customer_id, 'verify-immutability@example.invalid', now());
  INSERT INTO "LoyaltyAccount" ("id", "customerId", "updatedAt") VALUES (scratch_loyalty_id, scratch_customer_id, now());
  INSERT INTO "LedgerAccount" ("id", "code", "name", "type", "normalSide", "updatedAt")
    VALUES (scratch_account_id, 'VERIFY-9999', 'verify scratch', 'ASSET', 'DEBIT', now());
  INSERT INTO "JournalEntry" ("id", "entryNumber", "entryDate", "source", "status")
    VALUES (scratch_entry_id, 'VERIFY-JE-9999', current_date, 'manual', 'POSTED');
  INSERT INTO "JournalEntry" ("id", "entryNumber", "entryDate", "source", "status")
    VALUES (scratch_entry2_id, 'VERIFY-JE-9998', current_date, 'manual', 'POSTED');
  INSERT INTO "JournalLine" ("id", "journalEntryId", "accountId", "debit", "credit")
    VALUES (scratch_line_id, scratch_entry_id, scratch_account_id, 100, 0);
  INSERT INTO "AuditLog" ("id", "action", "entity") VALUES (scratch_audit_id, 'verify', 'verify');
  INSERT INTO "ConsentRecord" ("id", "customerId", "channel", "status")
    VALUES (scratch_consent_id, scratch_customer_id, 'EMAIL', 'GRANTED');
  INSERT INTO "LoyaltyTransaction" ("id", "loyaltyAccountId", "type", "points")
    VALUES (scratch_loyalty_txn_id, scratch_loyalty_id, 'EARN', 10);

  -- 3. Blocked mutations raise.
  -- AuditLog UPDATE / DELETE
  blocked := false;
  BEGIN
    UPDATE "AuditLog" SET "action" = 'tampered' WHERE "id" = scratch_audit_id;
  EXCEPTION WHEN raise_exception THEN blocked := true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'VERIFY FAILED: AuditLog UPDATE was not blocked'; END IF;
  blocked := false;
  BEGIN
    DELETE FROM "AuditLog" WHERE "id" = scratch_audit_id;
  EXCEPTION WHEN raise_exception THEN blocked := true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'VERIFY FAILED: AuditLog DELETE was not blocked'; END IF;

  -- JournalLine UPDATE / DELETE
  blocked := false;
  BEGIN
    UPDATE "JournalLine" SET "debit" = 999 WHERE "id" = scratch_line_id;
  EXCEPTION WHEN raise_exception THEN blocked := true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'VERIFY FAILED: JournalLine UPDATE was not blocked'; END IF;
  blocked := false;
  BEGIN
    DELETE FROM "JournalLine" WHERE "id" = scratch_line_id;
  EXCEPTION WHEN raise_exception THEN blocked := true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'VERIFY FAILED: JournalLine DELETE was not blocked'; END IF;

  -- ConsentRecord UPDATE / DELETE (corrections are new rows)
  blocked := false;
  BEGIN
    UPDATE "ConsentRecord" SET "status" = 'REVOKED' WHERE "id" = scratch_consent_id;
  EXCEPTION WHEN raise_exception THEN blocked := true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'VERIFY FAILED: ConsentRecord UPDATE was not blocked'; END IF;
  blocked := false;
  BEGIN
    DELETE FROM "ConsentRecord" WHERE "id" = scratch_consent_id;
  EXCEPTION WHEN raise_exception THEN blocked := true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'VERIFY FAILED: ConsentRecord DELETE was not blocked'; END IF;

  -- LoyaltyTransaction UPDATE / DELETE
  blocked := false;
  BEGIN
    UPDATE "LoyaltyTransaction" SET "points" = 999999 WHERE "id" = scratch_loyalty_txn_id;
  EXCEPTION WHEN raise_exception THEN blocked := true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'VERIFY FAILED: LoyaltyTransaction UPDATE was not blocked'; END IF;
  blocked := false;
  BEGIN
    DELETE FROM "LoyaltyTransaction" WHERE "id" = scratch_loyalty_txn_id;
  EXCEPTION WHEN raise_exception THEN blocked := true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'VERIFY FAILED: LoyaltyTransaction DELETE was not blocked'; END IF;

  -- InventoryLedger: update an existing row when present (creating the full
  -- product/branch graph as scratch is unnecessary); skip with a notice on an
  -- empty database — trigger existence is already asserted above.
  SELECT "id" INTO existing_inventory_ledger_id FROM "InventoryLedger" LIMIT 1;
  IF existing_inventory_ledger_id IS NOT NULL THEN
    blocked := false;
    BEGIN
      UPDATE "InventoryLedger" SET "reason" = 'tampered' WHERE "id" = existing_inventory_ledger_id;
    EXCEPTION WHEN raise_exception THEN blocked := true; END;
    IF NOT blocked THEN RAISE EXCEPTION 'VERIFY FAILED: InventoryLedger UPDATE was not blocked'; END IF;
    blocked := false;
    BEGIN
      DELETE FROM "InventoryLedger" WHERE "id" = existing_inventory_ledger_id;
    EXCEPTION WHEN raise_exception THEN blocked := true; END;
    IF NOT blocked THEN RAISE EXCEPTION 'VERIFY FAILED: InventoryLedger DELETE was not blocked'; END IF;
  ELSE
    RAISE NOTICE 'SKIPPED: InventoryLedger mutation matrix (table empty); trigger existence verified';
  END IF;

  -- JournalEntry: forbidden transitions and field edits raise.
  blocked := false;
  BEGIN
    UPDATE "JournalEntry" SET "status" = 'DRAFT' WHERE "id" = scratch_entry_id;
  EXCEPTION WHEN raise_exception THEN blocked := true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'VERIFY FAILED: JournalEntry POSTED->DRAFT was not blocked'; END IF;
  blocked := false;
  BEGIN
    UPDATE "JournalEntry" SET "memo" = 'tampered' WHERE "id" = scratch_entry_id;
  EXCEPTION WHEN raise_exception THEN blocked := true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'VERIFY FAILED: JournalEntry memo edit was not blocked'; END IF;
  blocked := false;
  BEGIN
    UPDATE "JournalEntry" SET "status" = 'REVERSED', "currency" = 'USD' WHERE "id" = scratch_entry_id;
  EXCEPTION WHEN raise_exception THEN blocked := true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'VERIFY FAILED: JournalEntry field edit during reversal was not blocked'; END IF;
  blocked := false;
  BEGIN
    DELETE FROM "JournalEntry" WHERE "id" = scratch_entry_id;
  EXCEPTION WHEN raise_exception THEN blocked := true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'VERIFY FAILED: JournalEntry DELETE was not blocked'; END IF;

  -- 4. Permitted transitions succeed.
  UPDATE "JournalEntry" SET "status" = 'REVERSED' WHERE "id" = scratch_entry_id;
  RAISE NOTICE 'OK: JournalEntry POSTED -> REVERSED permitted';
  blocked := false;
  BEGIN
    UPDATE "JournalEntry" SET "status" = 'POSTED' WHERE "id" = scratch_entry_id;
  EXCEPTION WHEN raise_exception THEN blocked := true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'VERIFY FAILED: JournalEntry REVERSED->POSTED was not blocked'; END IF;

  -- 5. Escape hatch is transaction-local and works (used by dev seeding).
  PERFORM set_config('elysia.allow_protected_mutation', 'on', true);
  DELETE FROM "AuditLog" WHERE "id" = scratch_audit_id;
  PERFORM set_config('elysia.allow_protected_mutation', 'off', true);
  blocked := false;
  BEGIN
    DELETE FROM "JournalLine" WHERE "id" = scratch_line_id;
  EXCEPTION WHEN raise_exception THEN blocked := true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'VERIFY FAILED: protection did not re-engage after escape hatch'; END IF;

  RAISE NOTICE 'OK: ADR 0004 immutability matrix verified (all blocked mutations raised, permitted transition succeeded)';
END;
$$;

ROLLBACK;
