-- CreateTable
CREATE TABLE "QualityInspection" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "sku" TEXT,
    "sampleSize" INTEGER NOT NULL,
    "defectsFound" INTEGER NOT NULL DEFAULT 0,
    "aqlPercent" DECIMAL(5,2) NOT NULL DEFAULT 1,
    "result" TEXT NOT NULL,
    "inspectorId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QualityInspection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QualityInspection_result_createdAt_idx" ON "QualityInspection"("result", "createdAt");
