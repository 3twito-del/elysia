-- H-05 service case timeline: additive-only (ADR 0008 policy).

-- CreateEnum
CREATE TYPE "ServiceRequestEventKind" AS ENUM ('RECEIVED', 'STATUS_CHANGED', 'NOTE', 'CUSTOMER_MESSAGE');

-- CreateEnum
CREATE TYPE "ServiceRequestEventVisibility" AS ENUM ('CUSTOMER', 'INTERNAL');

-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "customerId" TEXT;

-- CreateTable
CREATE TABLE "ServiceRequestEvent" (
    "id" TEXT NOT NULL,
    "serviceRequestId" TEXT NOT NULL,
    "kind" "ServiceRequestEventKind" NOT NULL,
    "visibility" "ServiceRequestEventVisibility" NOT NULL DEFAULT 'CUSTOMER',
    "status" "ServiceRequestStatus",
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceRequestEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceRequestEvent_serviceRequestId_createdAt_idx" ON "ServiceRequestEvent"("serviceRequestId", "createdAt");

-- CreateIndex
CREATE INDEX "ServiceRequest_customerId_idx" ON "ServiceRequest"("customerId");

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequestEvent" ADD CONSTRAINT "ServiceRequestEvent_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
