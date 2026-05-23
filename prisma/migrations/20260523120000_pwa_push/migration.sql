-- PWA offline idempotency and web push subscriptions/campaigns.
CREATE TABLE "OfflineActionReceipt" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "result" JSONB,
    "lastError" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfflineActionReceipt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "deviceId" TEXT,
    "customerId" TEXT,
    "sessionKey" TEXT,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
    "transactionalOptIn" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PushCampaign" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "segment" TEXT NOT NULL DEFAULT 'MARKETING_OPT_IN',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushCampaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PushDelivery" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT,
    "subscriptionId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushDelivery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductPushInterest" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'BACK_IN_STOCK',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductPushInterest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OfflineActionReceipt_deviceId_actionId_key" ON "OfflineActionReceipt"("deviceId", "actionId");
CREATE INDEX "OfflineActionReceipt_kind_status_idx" ON "OfflineActionReceipt"("kind", "status");
CREATE INDEX "OfflineActionReceipt_createdAt_idx" ON "OfflineActionReceipt"("createdAt");

CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
CREATE INDEX "PushSubscription_deviceId_idx" ON "PushSubscription"("deviceId");
CREATE INDEX "PushSubscription_customerId_idx" ON "PushSubscription"("customerId");
CREATE INDEX "PushSubscription_sessionKey_idx" ON "PushSubscription"("sessionKey");
CREATE INDEX "PushSubscription_status_marketingOptIn_idx" ON "PushSubscription"("status", "marketingOptIn");

CREATE INDEX "PushCampaign_status_scheduledAt_idx" ON "PushCampaign"("status", "scheduledAt");

CREATE INDEX "PushDelivery_campaignId_idx" ON "PushDelivery"("campaignId");
CREATE INDEX "PushDelivery_subscriptionId_status_idx" ON "PushDelivery"("subscriptionId", "status");
CREATE INDEX "PushDelivery_status_createdAt_idx" ON "PushDelivery"("status", "createdAt");

CREATE UNIQUE INDEX "ProductPushInterest_productId_subscriptionId_kind_key" ON "ProductPushInterest"("productId", "subscriptionId", "kind");
CREATE INDEX "ProductPushInterest_status_kind_idx" ON "ProductPushInterest"("status", "kind");

ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PushDelivery" ADD CONSTRAINT "PushDelivery_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "PushCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PushDelivery" ADD CONSTRAINT "PushDelivery_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "PushSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductPushInterest" ADD CONSTRAINT "ProductPushInterest_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductPushInterest" ADD CONSTRAINT "ProductPushInterest_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "PushSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
