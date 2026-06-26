-- AlterTable
ALTER TABLE "Order" ADD COLUMN "registerShiftId" TEXT;

-- CreateIndex
CREATE INDEX "Order_registerShiftId_idx" ON "Order"("registerShiftId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_registerShiftId_fkey" FOREIGN KEY ("registerShiftId") REFERENCES "RegisterShift"("id") ON DELETE SET NULL ON UPDATE CASCADE;
