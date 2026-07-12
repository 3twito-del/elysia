-- ADR 0005 (docs/DECISIONS.md): mandatory admin TOTP MFA + one-time recovery
-- codes. Purely additive: new nullable AdminUser columns + new operational
-- table. AdminRecoveryCode is intentionally outside ADR 0004's immutability
-- trigger set (see prisma/schema.prisma comment on the model).

-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN     "totpEnabledAt" TIMESTAMP(3),
ADD COLUMN     "totpPendingExpiresAt" TIMESTAMP(3),
ADD COLUMN     "totpPendingSecretEncrypted" TEXT,
ADD COLUMN     "totpSecretEncrypted" TEXT;

-- CreateTable
CREATE TABLE "AdminRecoveryCode" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminRecoveryCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminRecoveryCode_adminUserId_idx" ON "AdminRecoveryCode"("adminUserId");

-- AddForeignKey
ALTER TABLE "AdminRecoveryCode" ADD CONSTRAINT "AdminRecoveryCode_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
