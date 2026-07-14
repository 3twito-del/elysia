-- B-07 asset governance (docs/TASKS.md): provenance, license status,
-- expiration, and a generated-asset label on every ProductMedia row.
-- Additive-only; every new column defaults to UNKNOWN/false/null so existing
-- rows and existing readers are unaffected until reviewed.

-- CreateEnum
CREATE TYPE "MediaProvenance" AS ENUM ('SUPPLIER_FEED', 'OWNER_UPLOAD', 'AI_GENERATED', 'STOCK_LICENSED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "MediaLicenseStatus" AS ENUM ('OWNED', 'SUPPLIER_GRANTED', 'LICENSED', 'NEEDS_REVIEW', 'UNKNOWN');

-- AlterTable
ALTER TABLE "ProductMedia" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "isGenerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "licenseExpiresAt" TIMESTAMP(3),
ADD COLUMN     "licenseStatus" "MediaLicenseStatus" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "provenance" "MediaProvenance" NOT NULL DEFAULT 'UNKNOWN';
