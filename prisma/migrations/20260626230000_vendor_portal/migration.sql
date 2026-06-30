-- CreateTable
CREATE TABLE "VendorPortalToken" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "label" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorPortalToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VendorPortalToken_token_key" ON "VendorPortalToken"("token");

-- CreateIndex
CREATE INDEX "VendorPortalToken_vendorId_isActive_idx" ON "VendorPortalToken"("vendorId", "isActive");

-- AddForeignKey
ALTER TABLE "VendorPortalToken" ADD CONSTRAINT "VendorPortalToken_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
