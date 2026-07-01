-- CreateTable
CREATE TABLE "B2bAccount" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "companyName" TEXT,
    "taxId" TEXT,
    "discountPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "creditLimit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "paymentTermsDays" INTEGER NOT NULL DEFAULT 30,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "B2bAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "B2bAccount_customerId_key" ON "B2bAccount"("customerId");

-- CreateIndex
CREATE INDEX "B2bAccount_status_idx" ON "B2bAccount"("status");
