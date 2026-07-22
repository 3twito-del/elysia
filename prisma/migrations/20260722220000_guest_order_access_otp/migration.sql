CREATE TYPE "OtpPurpose" AS ENUM ('CUSTOMER_SIGN_IN', 'GUEST_ORDER_ACCESS');

ALTER TABLE "OtpChallenge"
ADD COLUMN "purpose" "OtpPurpose" NOT NULL DEFAULT 'CUSTOMER_SIGN_IN',
ADD COLUMN "contextKey" TEXT;

CREATE INDEX "OtpChallenge_identifier_channel_purpose_createdAt_idx"
ON "OtpChallenge"("identifier", "channel", "purpose", "createdAt");
