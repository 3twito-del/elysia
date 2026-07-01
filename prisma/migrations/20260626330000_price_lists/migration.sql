-- AlterTable
ALTER TABLE "B2bAccount" ADD COLUMN "priceListId" TEXT;

-- CreateTable
CREATE TABLE "PriceList" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ILS',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceListItem" (
    "id" TEXT NOT NULL,
    "priceListId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "PriceListItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PriceList_isActive_idx" ON "PriceList"("isActive");

-- CreateIndex
CREATE INDEX "PriceListItem_variantId_idx" ON "PriceListItem"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "PriceListItem_priceListId_variantId_key" ON "PriceListItem"("priceListId", "variantId");

-- CreateIndex
CREATE INDEX "B2bAccount_priceListId_idx" ON "B2bAccount"("priceListId");

-- AddForeignKey
ALTER TABLE "PriceListItem" ADD CONSTRAINT "PriceListItem_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "PriceList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "B2bAccount" ADD CONSTRAINT "B2bAccount_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "PriceList"("id") ON DELETE SET NULL ON UPDATE CASCADE;
