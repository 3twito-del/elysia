-- J-10 content governance (docs/TASKS.md): a review date already existed
-- (factVerifiedAt/policyVerifiedAt) but nothing enforced re-review -- a fact
-- verified once stayed "verified" forever. Adds an explicit expiration per
-- verification. Additive-only, nullable -- existing verified facts are not
-- retroactively assigned an expiration; the readiness engine flags them as
-- needing one (see catalog-readiness.ts).

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "factVerificationExpiresAt" TIMESTAMP(3),
ADD COLUMN     "policyVerificationExpiresAt" TIMESTAMP(3);
