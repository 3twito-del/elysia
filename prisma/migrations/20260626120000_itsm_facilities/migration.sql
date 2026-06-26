-- CreateTable
CREATE TABLE "ITTicket" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "requestedById" TEXT,
    "assignedToAdminUserId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ITTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ITAsset" (
    "id" TEXT NOT NULL,
    "assetTag" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IN_USE',
    "assignedTo" TEXT,
    "serialNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ITAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacilityRequest" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "branchId" TEXT,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "scheduledAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacilityRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ITTicket_ticketNumber_key" ON "ITTicket"("ticketNumber");

-- CreateIndex
CREATE INDEX "ITTicket_status_idx" ON "ITTicket"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ITAsset_assetTag_key" ON "ITAsset"("assetTag");

-- CreateIndex
CREATE INDEX "ITAsset_status_idx" ON "ITAsset"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FacilityRequest_requestNumber_key" ON "FacilityRequest"("requestNumber");

-- CreateIndex
CREATE INDEX "FacilityRequest_status_idx" ON "FacilityRequest"("status");
