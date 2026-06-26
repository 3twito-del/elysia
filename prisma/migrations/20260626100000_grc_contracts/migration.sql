-- CreateTable
CREATE TABLE "ComplianceItem" (
    "id" TEXT NOT NULL,
    "itemNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "ownerAdminUserId" TEXT,
    "dueAt" TIMESTAMP(3),
    "notes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "counterparty" TEXT NOT NULL,
    "type" TEXT,
    "value" DECIMAL(14,2),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "startsAt" DATE,
    "endsAt" DATE,
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceItem_itemNumber_key" ON "ComplianceItem"("itemNumber");

-- CreateIndex
CREATE INDEX "ComplianceItem_status_idx" ON "ComplianceItem"("status");

-- CreateIndex
CREATE INDEX "ComplianceItem_severity_idx" ON "ComplianceItem"("severity");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_contractNumber_key" ON "Contract"("contractNumber");

-- CreateIndex
CREATE INDEX "Contract_status_idx" ON "Contract"("status");

-- CreateIndex
CREATE INDEX "Contract_endsAt_idx" ON "Contract"("endsAt");
