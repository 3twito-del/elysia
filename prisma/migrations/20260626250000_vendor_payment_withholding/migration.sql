-- AlterTable
ALTER TABLE "VendorPayment" ADD COLUMN "withheldTax" DECIMAL(14,2) NOT NULL DEFAULT 0;
