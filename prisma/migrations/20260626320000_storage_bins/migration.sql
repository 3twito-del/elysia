-- CreateTable
CREATE TABLE "StorageBin" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorageBin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BinAssignment" (
    "id" TEXT NOT NULL,
    "binId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BinAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StorageBin_branchId_isActive_idx" ON "StorageBin"("branchId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "StorageBin_branchId_code_key" ON "StorageBin"("branchId", "code");

-- CreateIndex
CREATE INDEX "BinAssignment_variantId_idx" ON "BinAssignment"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "BinAssignment_binId_variantId_key" ON "BinAssignment"("binId", "variantId");

-- AddForeignKey
ALTER TABLE "BinAssignment" ADD CONSTRAINT "BinAssignment_binId_fkey" FOREIGN KEY ("binId") REFERENCES "StorageBin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
