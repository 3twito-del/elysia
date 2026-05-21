-- CreateEnum
CREATE TYPE "ProductAvailabilityMode" AS ENUM ('READY_TO_ORDER', 'MADE_TO_ORDER', 'CONSULTATION');

-- AlterTable
ALTER TABLE "Product"
ADD COLUMN "availabilityMode" "ProductAvailabilityMode" NOT NULL DEFAULT 'READY_TO_ORDER',
ADD COLUMN "commerceHighlights" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "deliveryPromise" TEXT,
ADD COLUMN "returnPolicy" TEXT;
