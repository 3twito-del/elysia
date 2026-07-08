-- ADR 0009 / ADR 0013 — launch-gate financial treatment.
-- Only OWN_SALE orders may post product-sale revenue to the GL. The column
-- default is fail-closed (UNKNOWN_BLOCKED): any order-creation path that does
-- not explicitly declare its treatment is blocked from the books.

-- CreateEnum
CREATE TYPE "FinancialTreatment" AS ENUM ('OWN_SALE', 'AGENCY_DROPSHIP', 'SUPPLIER_MOR_REFERENCE', 'COMMISSION_ONLY', 'UNKNOWN_BLOCKED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "financialTreatment" "FinancialTreatment" NOT NULL DEFAULT 'UNKNOWN_BLOCKED';

-- Backfill: every existing Order row was created by Elysia's own checkout,
-- POS, or manual-order paths (supplier Shopify orders live in the separate
-- ShopifyOrderMirror table and never enter "Order"), so existing rows are
-- OWN_SALE. New rows rely on explicit stamping by the creation path.
UPDATE "Order" SET "financialTreatment" = 'OWN_SALE';
