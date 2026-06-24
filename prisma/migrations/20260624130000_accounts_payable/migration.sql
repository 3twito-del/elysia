-- CreateTable
CREATE TABLE "VendorInvoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "purchaseOrderId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'ILS',
    "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "paidTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "invoiceDate" DATE NOT NULL,
    "dueDate" DATE,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorInvoiceLine" (
    "id" TEXT NOT NULL,
    "vendorInvoiceId" TEXT NOT NULL,
    "purchaseOrderItemId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" DECIMAL(14,2) NOT NULL,
    "lineTotal" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "VendorInvoiceLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorPayment" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ILS',
    "method" TEXT NOT NULL DEFAULT 'bank_transfer',
    "reference" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorPaymentAllocation" (
    "id" TEXT NOT NULL,
    "vendorPaymentId" TEXT NOT NULL,
    "vendorInvoiceId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "VendorPaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VendorInvoice_status_dueDate_idx" ON "VendorInvoice"("status", "dueDate");

-- CreateIndex
CREATE INDEX "VendorInvoice_purchaseOrderId_idx" ON "VendorInvoice"("purchaseOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorInvoice_vendorId_invoiceNumber_key" ON "VendorInvoice"("vendorId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "VendorInvoiceLine_vendorInvoiceId_idx" ON "VendorInvoiceLine"("vendorInvoiceId");

-- CreateIndex
CREATE INDEX "VendorInvoiceLine_purchaseOrderItemId_idx" ON "VendorInvoiceLine"("purchaseOrderItemId");

-- CreateIndex
CREATE INDEX "VendorPayment_vendorId_paidAt_idx" ON "VendorPayment"("vendorId", "paidAt");

-- CreateIndex
CREATE INDEX "VendorPaymentAllocation_vendorPaymentId_idx" ON "VendorPaymentAllocation"("vendorPaymentId");

-- CreateIndex
CREATE INDEX "VendorPaymentAllocation_vendorInvoiceId_idx" ON "VendorPaymentAllocation"("vendorInvoiceId");

-- AddForeignKey
ALTER TABLE "VendorInvoice" ADD CONSTRAINT "VendorInvoice_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorInvoice" ADD CONSTRAINT "VendorInvoice_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorInvoiceLine" ADD CONSTRAINT "VendorInvoiceLine_vendorInvoiceId_fkey" FOREIGN KEY ("vendorInvoiceId") REFERENCES "VendorInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorInvoiceLine" ADD CONSTRAINT "VendorInvoiceLine_purchaseOrderItemId_fkey" FOREIGN KEY ("purchaseOrderItemId") REFERENCES "PurchaseOrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPayment" ADD CONSTRAINT "VendorPayment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPaymentAllocation" ADD CONSTRAINT "VendorPaymentAllocation_vendorPaymentId_fkey" FOREIGN KEY ("vendorPaymentId") REFERENCES "VendorPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPaymentAllocation" ADD CONSTRAINT "VendorPaymentAllocation_vendorInvoiceId_fkey" FOREIGN KEY ("vendorInvoiceId") REFERENCES "VendorInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
