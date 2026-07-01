-- CreateTable
CREATE TABLE "LandedCost" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "basis" TEXT NOT NULL DEFAULT 'VALUE',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandedCost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LandedCost_purchaseOrderId_idx" ON "LandedCost"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "LandedCost_status_idx" ON "LandedCost"("status");

-- AddForeignKey
ALTER TABLE "LandedCost" ADD CONSTRAINT "LandedCost_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
