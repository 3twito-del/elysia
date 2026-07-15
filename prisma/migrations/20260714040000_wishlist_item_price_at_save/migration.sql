-- I-05 (docs/TASKS.md): capture the price at the moment a wishlist item is
-- saved, so a real "price changed since you saved it" cue can be shown
-- instead of a fabricated one. Additive-only, nullable -- existing rows are
-- never backfilled with a guessed historical price.

-- AlterTable
ALTER TABLE "WishlistItem" ADD COLUMN     "priceAtSave" DECIMAL(10,2);
