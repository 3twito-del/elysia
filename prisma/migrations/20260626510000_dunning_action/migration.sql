-- CreateTable
CREATE TABLE "DunningAction" (
    "id" TEXT NOT NULL,
    "customerInvoiceId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DunningAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DunningAction_customerInvoiceId_createdAt_idx" ON "DunningAction"("customerInvoiceId", "createdAt");
