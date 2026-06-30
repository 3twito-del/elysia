-- AlterTable
ALTER TABLE "Branch" ADD COLUMN "entityId" TEXT;

-- CreateIndex
CREATE INDEX "Branch_entityId_idx" ON "Branch"("entityId");
