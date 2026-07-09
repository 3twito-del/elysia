-- ADR 0012 (docs/DECISIONS.md): dropship display truth.
-- Freshness stamp for the mandatory fail-closed click-out verification.
ALTER TABLE "ProductVariant" ADD COLUMN "lastLiveVerifiedAt" TIMESTAMP(3);
