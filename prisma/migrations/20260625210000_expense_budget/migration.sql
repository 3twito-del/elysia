-- CreateTable
CREATE TABLE "ExpenseClaim" (
    "id" TEXT NOT NULL,
    "claimNumber" TEXT NOT NULL,
    "employeeId" TEXT,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ILS',
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "incurredAt" DATE NOT NULL,
    "notes" TEXT,
    "journalEntryId" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetLine" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "accountCode" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseClaim_claimNumber_key" ON "ExpenseClaim"("claimNumber");

-- CreateIndex
CREATE INDEX "ExpenseClaim_status_idx" ON "ExpenseClaim"("status");

-- CreateIndex
CREATE INDEX "ExpenseClaim_employeeId_idx" ON "ExpenseClaim"("employeeId");

-- CreateIndex
CREATE INDEX "BudgetLine_period_idx" ON "BudgetLine"("period");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetLine_period_accountCode_key" ON "BudgetLine"("period", "accountCode");

-- AddForeignKey
ALTER TABLE "ExpenseClaim" ADD CONSTRAINT "ExpenseClaim_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
