-- K-13 residual (docs/TASKS.md): hand-isolated from a full `prisma migrate
-- diff` against schema.prisma. Two independent, additive-only fixes:
--
-- 1. ServiceSettings column defaults never matched schema.prisma's
--    @default() values at the DB level (only affects newly-inserted rows
--    without an explicit value; the singleton "default" row already exists).
-- 2. The implicit many-to-many join tables for BlogPost<->BlogTag and
--    BlogPost<->Product used a unique index (older Prisma convention);
--    schema.prisma's current Prisma version represents these as a composite
--    primary key instead. Functionally equivalent (both prevent duplicate
--    pairs) -- this just brings the DB constraint shape in line with what
--    Prisma now generates, with no data change.

-- AlterTable
ALTER TABLE "ServiceSettings" ALTER COLUMN "phoneE164" SET DEFAULT '+972000000000',
ALTER COLUMN "displayPhone" SET DEFAULT '05X-XXXXXXX',
ALTER COLUMN "serviceEmail" SET DEFAULT 'support@example.com';

-- AlterTable
ALTER TABLE "_BlogPostToBlogTag" ADD CONSTRAINT "_BlogPostToBlogTag_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_BlogPostToBlogTag_AB_unique";

-- AlterTable
ALTER TABLE "_BlogPostToProduct" ADD CONSTRAINT "_BlogPostToProduct_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_BlogPostToProduct_AB_unique";
