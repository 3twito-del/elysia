-- P2P-007: batched vendor payment runs (PaymentRun/PaymentRunLine) and the
-- withholding-tax-payable ledger account they (and the existing single-invoice
-- payment flow) need to post GL entries that correctly split Cash vs the
-- amount withheld at source.

-- CreateTable
CREATE TABLE "PaymentRun" (
    "id" TEXT NOT NULL,
    "runNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'ILS',
    "scheduledAt" TIMESTAMP(3),
    "totalAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalWithheld" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdById" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRunLine" (
    "id" TEXT NOT NULL,
    "paymentRunId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "vendorInvoiceId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "withheldTax" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "vendorPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentRunLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRun_runNumber_key" ON "PaymentRun"("runNumber");

-- CreateIndex
CREATE INDEX "PaymentRun_status_createdAt_idx" ON "PaymentRun"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRunLine_paymentRunId_vendorInvoiceId_key" ON "PaymentRunLine"("paymentRunId", "vendorInvoiceId");

-- CreateIndex
CREATE INDEX "PaymentRunLine_paymentRunId_idx" ON "PaymentRunLine"("paymentRunId");

-- CreateIndex
CREATE INDEX "PaymentRunLine_vendorId_idx" ON "PaymentRunLine"("vendorId");

-- CreateIndex
CREATE INDEX "PaymentRunLine_vendorInvoiceId_idx" ON "PaymentRunLine"("vendorInvoiceId");

-- AddForeignKey
ALTER TABLE "PaymentRunLine" ADD CONSTRAINT "PaymentRunLine_paymentRunId_fkey" FOREIGN KEY ("paymentRunId") REFERENCES "PaymentRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRunLine" ADD CONSTRAINT "PaymentRunLine_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRunLine" ADD CONSTRAINT "PaymentRunLine_vendorInvoiceId_fkey" FOREIGN KEY ("vendorInvoiceId") REFERENCES "VendorInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRunLine" ADD CONSTRAINT "PaymentRunLine_vendorPaymentId_fkey" FOREIGN KEY ("vendorPaymentId") REFERENCES "VendorPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed the withholding-tax-payable liability account (chart of accounts is
-- normally upserted by prisma/seed.ts; this keeps `migrate deploy` alone
-- sufficient so recordVendorPayment/executePaymentRun can post it).
INSERT INTO "LedgerAccount" ("id", "code", "name", "type", "normalSide", "isActive", "createdAt", "updatedAt")
VALUES (
  'ledger_withholding_tax_payable',
  '2210',
  'ניכוי מס במקור לתשלום (רשות המסים)',
  'LIABILITY',
  'CREDIT',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("code") DO NOTHING;
