-- Extend admin permissions without removing existing broad permissions.
ALTER TYPE "AdminPermission" ADD VALUE 'CATALOG_READ';
ALTER TYPE "AdminPermission" ADD VALUE 'CATALOG_WRITE';
ALTER TYPE "AdminPermission" ADD VALUE 'INVENTORY_READ';
ALTER TYPE "AdminPermission" ADD VALUE 'INVENTORY_WRITE';
ALTER TYPE "AdminPermission" ADD VALUE 'ORDERS_READ';
ALTER TYPE "AdminPermission" ADD VALUE 'ORDERS_WRITE';
ALTER TYPE "AdminPermission" ADD VALUE 'ORDERS_REFUND';
ALTER TYPE "AdminPermission" ADD VALUE 'CUSTOMER_VIEW';
ALTER TYPE "AdminPermission" ADD VALUE 'CUSTOMER_WRITE';
ALTER TYPE "AdminPermission" ADD VALUE 'SYSTEM_CONFIG';

CREATE TYPE "OutboxEventStatus" AS ENUM ('PENDING', 'PUBLISHED', 'PROCESSING', 'PROCESSED', 'FAILED');
CREATE TYPE "JobRunStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED');

ALTER TABLE "ProductMedia" ADD COLUMN "isPrimary" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Cart" ADD COLUMN "sessionKey" TEXT;
ALTER TABLE "Cart" ADD COLUMN "expiresAt" TIMESTAMP(3);
ALTER TABLE "Cart" ADD COLUMN "mergeMetadata" JSONB;

ALTER TABLE "Order" ADD COLUMN "paidAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "preparingAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "readyForPickupAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "shippedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "completedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "cancelledAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "refundedAt" TIMESTAMP(3);

ALTER TABLE "Payment" ADD COLUMN "providerStatus" TEXT;
ALTER TABLE "Payment" ADD COLUMN "failureCode" TEXT;
ALTER TABLE "Payment" ADD COLUMN "capturedAt" TIMESTAMP(3);
ALTER TABLE "Payment" ADD COLUMN "refundedAt" TIMESTAMP(3);

ALTER TABLE "WebhookEvent" ADD COLUMN "rawBodyHash" TEXT;

CREATE TABLE "OutboxEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "aggregateType" TEXT,
    "aggregateId" TEXT,
    "payload" JSONB NOT NULL,
    "status" "OutboxEventStatus" NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "JobRun" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "JobRunStatus" NOT NULL DEFAULT 'RUNNING',
    "outboxEventId" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "lastError" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "JobRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductViewEvent" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sessionKey" TEXT,
    "customerId" TEXT,
    "path" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductViewEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductClickEvent" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "query" TEXT,
    "position" INTEGER,
    "sessionKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductClickEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OutboxEvent_idempotencyKey_key" ON "OutboxEvent"("idempotencyKey");
CREATE INDEX "OutboxEvent_status_availableAt_idx" ON "OutboxEvent"("status", "availableAt");
CREATE INDEX "OutboxEvent_type_idx" ON "OutboxEvent"("type");
CREATE INDEX "OutboxEvent_aggregateType_aggregateId_idx" ON "OutboxEvent"("aggregateType", "aggregateId");

CREATE INDEX "JobRun_name_status_idx" ON "JobRun"("name", "status");
CREATE INDEX "JobRun_outboxEventId_idx" ON "JobRun"("outboxEventId");

CREATE INDEX "Cart_sessionKey_status_idx" ON "Cart"("sessionKey", "status");
CREATE INDEX "Cart_customerId_status_idx" ON "Cart"("customerId", "status");
CREATE INDEX "WebhookEvent_provider_rawBodyHash_idx" ON "WebhookEvent"("provider", "rawBodyHash");
CREATE INDEX "ProductViewEvent_productId_createdAt_idx" ON "ProductViewEvent"("productId", "createdAt");
CREATE INDEX "ProductViewEvent_sessionKey_createdAt_idx" ON "ProductViewEvent"("sessionKey", "createdAt");
CREATE INDEX "ProductViewEvent_customerId_createdAt_idx" ON "ProductViewEvent"("customerId", "createdAt");
CREATE INDEX "ProductClickEvent_productId_createdAt_idx" ON "ProductClickEvent"("productId", "createdAt");
CREATE INDEX "ProductClickEvent_query_createdAt_idx" ON "ProductClickEvent"("query", "createdAt");
CREATE INDEX "ProductClickEvent_sessionKey_createdAt_idx" ON "ProductClickEvent"("sessionKey", "createdAt");

ALTER TABLE "JobRun" ADD CONSTRAINT "JobRun_outboxEventId_fkey" FOREIGN KEY ("outboxEventId") REFERENCES "OutboxEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductViewEvent" ADD CONSTRAINT "ProductViewEvent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductClickEvent" ADD CONSTRAINT "ProductClickEvent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
