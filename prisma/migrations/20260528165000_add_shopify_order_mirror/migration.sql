-- Mirror Shopify dropshipping orders for account/admin visibility without creating local orders.
CREATE TABLE "ShopifyOrderMirror" (
  "id" TEXT NOT NULL,
  "shopifyOrderId" TEXT NOT NULL,
  "shopifyOrderName" TEXT,
  "customerEmail" TEXT,
  "financialStatus" TEXT,
  "fulfillmentStatus" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'ILS',
  "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "supplierKey" TEXT,
  "lineItems" JSONB NOT NULL,
  "rawPayload" JSONB,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ShopifyOrderMirror_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ShopifyOrderMirror_shopifyOrderId_key"
  ON "ShopifyOrderMirror"("shopifyOrderId");

CREATE INDEX "ShopifyOrderMirror_customerEmail_idx"
  ON "ShopifyOrderMirror"("customerEmail");

CREATE INDEX "ShopifyOrderMirror_financialStatus_idx"
  ON "ShopifyOrderMirror"("financialStatus");

CREATE INDEX "ShopifyOrderMirror_fulfillmentStatus_idx"
  ON "ShopifyOrderMirror"("fulfillmentStatus");

CREATE INDEX "ShopifyOrderMirror_supplierKey_idx"
  ON "ShopifyOrderMirror"("supplierKey");
