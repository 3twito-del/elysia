-- CreateTable
CREATE TABLE "EdiDocument" (
    "id" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'OUTBOUND',
    "partner" TEXT,
    "reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'GENERATED',
    "payload" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EdiDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EdiDocument_docType_createdAt_idx" ON "EdiDocument"("docType", "createdAt");
