-- ADR 0007 (docs/DECISIONS.md): durable OperationalAlerts from class-aware
-- invariant sweeps. Alerts are for violated business reality; logs are for
-- developers.
CREATE TABLE "OperationalAlert" (
    "id" TEXT NOT NULL,
    "alertKey" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "invariant" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "measuredValue" TEXT,
    "thresholdValue" TEXT,
    "remediationHint" TEXT,
    "occurrenceCount" INTEGER NOT NULL DEFAULT 1,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "lastNotifiedAt" TIMESTAMP(3),
    "notifyCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalAlert_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OperationalAlert_alertKey_key" ON "OperationalAlert"("alertKey");
CREATE INDEX "OperationalAlert_status_severity_idx" ON "OperationalAlert"("status", "severity");
CREATE INDEX "OperationalAlert_class_status_idx" ON "OperationalAlert"("class", "status");
