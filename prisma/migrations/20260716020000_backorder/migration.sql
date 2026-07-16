-- OMS-002 (docs/ERP_CRM_MASTER_BLUEPRINT.md): managed backorder. Additive
-- only -- backorderEnabled defaults false (no product silently becomes
-- backorderable), backorderedQuantity defaults 0 (existing orders read as
-- "nothing was backordered", matching reality).

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "backorderEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "backorderedQuantity" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Backorder" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "fulfilledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Backorder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Backorder_variantId_status_idx" ON "Backorder"("variantId", "status");

-- CreateIndex
CREATE INDEX "Backorder_branchId_status_idx" ON "Backorder"("branchId", "status");

-- CreateIndex
CREATE INDEX "Backorder_orderId_idx" ON "Backorder"("orderId");

-- CreateIndex
CREATE INDEX "Backorder_status_createdAt_idx" ON "Backorder"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "Backorder" ADD CONSTRAINT "Backorder_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Backorder" ADD CONSTRAINT "Backorder_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Backorder" ADD CONSTRAINT "Backorder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Backorder" ADD CONSTRAINT "Backorder_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
