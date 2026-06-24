-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "assignedAdminUserId" TEXT,
ADD COLUMN     "firstRespondedAt" TIMESTAMP(3),
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "resolvedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ServiceRequest_status_priority_idx" ON "ServiceRequest"("status", "priority");

