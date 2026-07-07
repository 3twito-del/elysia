import { PrismaClient } from "@prisma/client";

import { seedCategories, seedCollections } from "../prisma/seed-catalog";

const prisma = new PrismaClient();

async function main() {
  let updated = 0;
  let skipped = 0;

  for (const category of seedCategories) {
    try {
      await prisma.category.update({
        where: { slug: category.slug },
        data: { description: category.description },
      });
      updated += 1;
      console.log(`category ${category.slug}: description updated`);
    } catch {
      skipped += 1;
      console.warn(`category ${category.slug}: not found, skipped`);
    }
  }

  for (const collection of seedCollections) {
    try {
      await prisma.collection.update({
        where: { slug: collection.slug },
        data: { description: collection.description },
      });
      updated += 1;
      console.log(`collection ${collection.slug}: description updated`);
    } catch {
      skipped += 1;
      console.warn(`collection ${collection.slug}: not found, skipped`);
    }
  }

  console.log(`Done. ${updated} updated, ${skipped} skipped.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
