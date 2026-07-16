-- OMS-006 (docs/ERP_CRM_MASTER_BLUEPRINT.md): partial/line-level RMA.
-- Additive-only -- every new column defaults to 0 so existing rows are
-- read as "nothing refunded yet", matching reality.

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "refundedQuantity" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "refundedAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ReturnRequestLine" (
    "id" TEXT NOT NULL,
    "returnRequestId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "ReturnRequestLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReturnRequestLine_returnRequestId_idx" ON "ReturnRequestLine"("returnRequestId");

-- CreateIndex
CREATE INDEX "ReturnRequestLine_orderItemId_idx" ON "ReturnRequestLine"("orderItemId");

-- AddForeignKey
ALTER TABLE "ReturnRequestLine" ADD CONSTRAINT "ReturnRequestLine_returnRequestId_fkey" FOREIGN KEY ("returnRequestId") REFERENCES "ReturnRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnRequestLine" ADD CONSTRAINT "ReturnRequestLine_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
