-- AlterTable
ALTER TABLE "CustomerInvoice" ADD COLUMN "allocationNumber" TEXT;
ALTER TABLE "CustomerInvoice" ADD COLUMN "allocationStatus" TEXT NOT NULL DEFAULT 'NOT_REQUIRED';

-- CreateTable
CREATE TABLE "WithholdingTaxRule" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "ratePercent" DECIMAL(5,2) NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WithholdingTaxRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WithholdingTaxRule_category_isActive_idx" ON "WithholdingTaxRule"("category", "isActive");
