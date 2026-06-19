-- CreateEnum
CREATE TYPE "ProductMediaRole" AS ENUM ('PRIMARY', 'ALTERNATE', 'SCALE', 'CONSTRUCTION', 'MATERIAL', 'CONTEXT');

-- AlterTable
ALTER TABLE "Product"
ADD COLUMN "countryOfManufacture" TEXT,
ADD COLUMN "manufacturerOrImporter" TEXT,
ADD COLUMN "materialDetails" TEXT,
ADD COLUMN "measurements" TEXT,
ADD COLUMN "stoneDetails" TEXT,
ADD COLUMN "factSourceReference" TEXT,
ADD COLUMN "factVerifiedAt" TIMESTAMP(3),
ADD COLUMN "factVerifiedBy" TEXT,
ADD COLUMN "policySourceReference" TEXT,
ADD COLUMN "policyVerifiedAt" TIMESTAMP(3),
ADD COLUMN "policyVerifiedBy" TEXT;

-- AlterTable
ALTER TABLE "ProductMedia" ADD COLUMN "role" "ProductMediaRole";

-- Existing primary flags are structural metadata, not product-fact verification.
UPDATE "ProductMedia"
SET "role" = 'PRIMARY'
WHERE "isPrimary" = true;

-- CreateIndex
CREATE INDEX "ProductMedia_productId_role_idx" ON "ProductMedia"("productId", "role");
