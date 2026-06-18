-- Add source-level commerce ownership for future Shopify dropshipping support.
CREATE TYPE "ProductSource" AS ENUM ('OWN', 'DROPSHIP_SHOPIFY');

ALTER TABLE "Product"
  ADD COLUMN "source" "ProductSource" NOT NULL DEFAULT 'OWN',
  ADD COLUMN "externalProvider" TEXT,
  ADD COLUMN "externalProductId" TEXT,
  ADD COLUMN "externalHandle" TEXT,
  ADD COLUMN "supplierKey" TEXT,
  ADD COLUMN "externalSyncedAt" TIMESTAMP(3);

ALTER TABLE "ProductVariant"
  ADD COLUMN "externalVariantId" TEXT;

CREATE INDEX "Product_source_idx" ON "Product"("source");
CREATE INDEX "Product_externalProvider_externalProductId_idx" ON "Product"("externalProvider", "externalProductId");
CREATE INDEX "Product_supplierKey_idx" ON "Product"("supplierKey");
CREATE INDEX "ProductVariant_externalVariantId_idx" ON "ProductVariant"("externalVariantId");
