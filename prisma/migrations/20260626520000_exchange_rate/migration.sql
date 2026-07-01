-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "rateToBase" DECIMAL(18,6) NOT NULL,
    "effectiveDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExchangeRate_currency_effectiveDate_idx" ON "ExchangeRate"("currency", "effectiveDate");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRate_currency_effectiveDate_key" ON "ExchangeRate"("currency", "effectiveDate");
