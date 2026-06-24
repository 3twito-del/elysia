-- CreateTable
CREATE TABLE "ItemCostLayer" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "unitCost" DECIMAL(14,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'purchase_receipt',
    "sourceId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'ILS',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemCostLayer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ItemCostLayer_branchId_variantId_receivedAt_idx" ON "ItemCostLayer"("branchId", "variantId", "receivedAt");

-- CreateIndex
CREATE INDEX "ItemCostLayer_variantId_idx" ON "ItemCostLayer"("variantId");

