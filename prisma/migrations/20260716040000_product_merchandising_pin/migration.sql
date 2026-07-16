-- CMS-003 merchandising pin-boost: an optional rank that pins a product to
-- the front of its category's default listing, overriding organic
-- popularity ordering. Additive, nullable -- every existing row defaults to
-- unpinned (null), no behavior change until an admin sets one.

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "merchandisingPinRank" INTEGER;
