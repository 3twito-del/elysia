-- CreateTable
CREATE TABLE "B2bAuthorizedBuyer" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT,
    "spendLimit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "B2bAuthorizedBuyer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "B2bAuthorizedBuyer_accountId_status_idx" ON "B2bAuthorizedBuyer"("accountId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "B2bAuthorizedBuyer_accountId_email_key" ON "B2bAuthorizedBuyer"("accountId", "email");

-- AddForeignKey
ALTER TABLE "B2bAuthorizedBuyer" ADD CONSTRAINT "B2bAuthorizedBuyer_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "B2bAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
