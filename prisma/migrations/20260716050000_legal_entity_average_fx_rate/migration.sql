-- ENT-003: an optional period-average FX rate per entity, used to translate
-- P&L accounts (revenue/expense) at consolidation instead of the closing
-- rate used for balance-sheet accounts -- real multi-currency consolidation
-- practice. Additive/nullable: every existing entity falls back to its
-- existing fxRateToBase (closing rate) until an admin sets a distinct one,
-- so consolidation output is unchanged unless opted in.

-- AlterTable
ALTER TABLE "LegalEntity" ADD COLUMN "averageFxRateToBase" DECIMAL(18,6);
