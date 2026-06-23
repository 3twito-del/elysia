-- AlterTable
ALTER TABLE "AnalyticsEvent"
ADD COLUMN "visitorId" TEXT,
ADD COLUMN "sessionId" TEXT,
ADD COLUMN "source" TEXT NOT NULL DEFAULT 'server',
ADD COLUMN "sequence" INTEGER,
ADD COLUMN "url" TEXT,
ADD COLUMN "title" TEXT,
ADD COLUMN "viewport" JSONB,
ADD COLUMN "geo" JSONB,
ADD COLUMN "attribution" JSONB,
ADD COLUMN "schemaVersion" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "AnalyticsVisitor" (
    "id" TEXT NOT NULL,
    "visitorKeyHash" TEXT NOT NULL,
    "customerId" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstPath" TEXT,
    "firstReferrer" TEXT,
    "firstUtm" JSONB,
    "device" JSONB,
    "geo" JSONB,

    CONSTRAINT "AnalyticsVisitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsSession" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT,
    "customerId" TEXT,
    "sessionKeyHash" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "entryPath" TEXT,
    "exitPath" TEXT,
    "referrer" TEXT,
    "utm" JSONB,
    "device" JSONB,
    "geo" JSONB,
    "eventCount" INTEGER NOT NULL DEFAULT 0,
    "replayEnabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AnalyticsSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsReplayChunk" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "sessionKeyHash" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "eventCount" INTEGER NOT NULL DEFAULT 0,
    "sizeBytes" INTEGER NOT NULL DEFAULT 0,
    "checksum" TEXT NOT NULL,
    "masked" BOOLEAN NOT NULL DEFAULT true,
    "events" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsReplayChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsHourlyAggregate" (
    "id" TEXT NOT NULL,
    "hour" TIMESTAMP(3) NOT NULL,
    "metric" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'site',
    "count" INTEGER NOT NULL DEFAULT 0,
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsHourlyAggregate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageDailyMetric" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "path" TEXT NOT NULL,
    "title" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "visitors" INTEGER NOT NULL DEFAULT 0,
    "sessions" INTEGER NOT NULL DEFAULT 0,
    "entrances" INTEGER NOT NULL DEFAULT 0,
    "exits" INTEGER NOT NULL DEFAULT 0,
    "ctaClicks" INTEGER NOT NULL DEFAULT 0,
    "formErrors" INTEGER NOT NULL DEFAULT 0,
    "avgScrollDepth" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageDailyMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignDailyMetric" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "source" TEXT NOT NULL,
    "medium" TEXT NOT NULL,
    "campaign" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "visitors" INTEGER NOT NULL DEFAULT 0,
    "sessions" INTEGER NOT NULL DEFAULT 0,
    "orders" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "grossMargin" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignDailyMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttributionTouchpoint" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT,
    "sessionId" TEXT,
    "customerId" TEXT,
    "orderId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "source" TEXT,
    "medium" TEXT,
    "campaign" TEXT,
    "referrer" TEXT,
    "landingPath" TEXT,
    "weight" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttributionTouchpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderAttribution" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "source" TEXT,
    "medium" TEXT,
    "campaign" TEXT,
    "firstTouch" JSONB,
    "lastTouch" JSONB,
    "conversionTouch" JSONB,
    "revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "grossMargin" DECIMAL(12,2),
    "modelVersion" TEXT NOT NULL DEFAULT 'v1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderAttribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BIKpiSnapshot" (
    "id" TEXT NOT NULL,
    "granularity" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "metric" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "value" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BIKpiSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsVisitor_visitorKeyHash_key" ON "AnalyticsVisitor"("visitorKeyHash");
CREATE INDEX "AnalyticsVisitor_customerId_idx" ON "AnalyticsVisitor"("customerId");
CREATE INDEX "AnalyticsVisitor_lastSeenAt_idx" ON "AnalyticsVisitor"("lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsSession_sessionKeyHash_key" ON "AnalyticsSession"("sessionKeyHash");
CREATE INDEX "AnalyticsSession_visitorId_startedAt_idx" ON "AnalyticsSession"("visitorId", "startedAt");
CREATE INDEX "AnalyticsSession_customerId_startedAt_idx" ON "AnalyticsSession"("customerId", "startedAt");
CREATE INDEX "AnalyticsSession_lastSeenAt_idx" ON "AnalyticsSession"("lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsReplayChunk_sessionKeyHash_sequence_key" ON "AnalyticsReplayChunk"("sessionKeyHash", "sequence");
CREATE INDEX "AnalyticsReplayChunk_sessionId_sequence_idx" ON "AnalyticsReplayChunk"("sessionId", "sequence");
CREATE INDEX "AnalyticsReplayChunk_createdAt_idx" ON "AnalyticsReplayChunk"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsHourlyAggregate_hour_metric_scope_key" ON "AnalyticsHourlyAggregate"("hour", "metric", "scope");
CREATE INDEX "AnalyticsHourlyAggregate_metric_hour_idx" ON "AnalyticsHourlyAggregate"("metric", "hour");

-- CreateIndex
CREATE UNIQUE INDEX "PageDailyMetric_date_path_key" ON "PageDailyMetric"("date", "path");
CREATE INDEX "PageDailyMetric_path_date_idx" ON "PageDailyMetric"("path", "date");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignDailyMetric_date_source_medium_campaign_key" ON "CampaignDailyMetric"("date", "source", "medium", "campaign");
CREATE INDEX "CampaignDailyMetric_channel_date_idx" ON "CampaignDailyMetric"("channel", "date");

-- CreateIndex
CREATE INDEX "AttributionTouchpoint_visitorId_occurredAt_idx" ON "AttributionTouchpoint"("visitorId", "occurredAt");
CREATE INDEX "AttributionTouchpoint_sessionId_occurredAt_idx" ON "AttributionTouchpoint"("sessionId", "occurredAt");
CREATE INDEX "AttributionTouchpoint_customerId_occurredAt_idx" ON "AttributionTouchpoint"("customerId", "occurredAt");
CREATE INDEX "AttributionTouchpoint_orderId_idx" ON "AttributionTouchpoint"("orderId");
CREATE INDEX "AttributionTouchpoint_source_medium_campaign_idx" ON "AttributionTouchpoint"("source", "medium", "campaign");

-- CreateIndex
CREATE UNIQUE INDEX "OrderAttribution_orderId_key" ON "OrderAttribution"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "BIKpiSnapshot_granularity_periodStart_periodEnd_metric_key" ON "BIKpiSnapshot"("granularity", "periodStart", "periodEnd", "metric");
CREATE INDEX "BIKpiSnapshot_metric_periodStart_idx" ON "BIKpiSnapshot"("metric", "periodStart");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_visitorId_occurredAt_idx" ON "AnalyticsEvent"("visitorId", "occurredAt");
CREATE INDEX "AnalyticsEvent_sessionId_occurredAt_idx" ON "AnalyticsEvent"("sessionId", "occurredAt");
CREATE INDEX "AnalyticsEvent_source_occurredAt_idx" ON "AnalyticsEvent"("source", "occurredAt");
CREATE INDEX "AnalyticsEvent_path_occurredAt_idx" ON "AnalyticsEvent"("path", "occurredAt");

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "AnalyticsVisitor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AnalyticsSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AnalyticsVisitor" ADD CONSTRAINT "AnalyticsVisitor_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AnalyticsSession" ADD CONSTRAINT "AnalyticsSession_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "AnalyticsVisitor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AnalyticsSession" ADD CONSTRAINT "AnalyticsSession_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AnalyticsReplayChunk" ADD CONSTRAINT "AnalyticsReplayChunk_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AnalyticsSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AttributionTouchpoint" ADD CONSTRAINT "AttributionTouchpoint_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "AnalyticsVisitor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AttributionTouchpoint" ADD CONSTRAINT "AttributionTouchpoint_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AnalyticsSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AttributionTouchpoint" ADD CONSTRAINT "AttributionTouchpoint_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AttributionTouchpoint" ADD CONSTRAINT "AttributionTouchpoint_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderAttribution" ADD CONSTRAINT "OrderAttribution_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
