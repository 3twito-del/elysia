-- CreateTable
CREATE TABLE "CrmActivity" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'NOTE',
    "subject" TEXT NOT NULL,
    "body" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerId" TEXT,
    "leadId" TEXT,
    "opportunityId" TEXT,
    "createdByAdminUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CrmActivity_customerId_occurredAt_idx" ON "CrmActivity"("customerId", "occurredAt");

-- CreateIndex
CREATE INDEX "CrmActivity_leadId_occurredAt_idx" ON "CrmActivity"("leadId", "occurredAt");

-- CreateIndex
CREATE INDEX "CrmActivity_opportunityId_occurredAt_idx" ON "CrmActivity"("opportunityId", "occurredAt");

-- CreateIndex
CREATE INDEX "CrmActivity_occurredAt_idx" ON "CrmActivity"("occurredAt");
