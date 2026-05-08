import { PrismaClient } from "@prisma/client";

import { hashPassword } from "../src/server/auth/password";
import {
  getSeedProducts,
  seedCategories,
  seedCollections,
  seedMaterials,
  seedStones,
} from "./seed-catalog";

const prisma = new PrismaClient();

async function getBootstrapAdmin() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const configuredName = process.env.ADMIN_BOOTSTRAP_NAME?.trim();
  const name =
    configuredName && configuredName.length > 0
      ? configuredName
      : "Aphrodite Admin";

  if (!email || !password) {
    throw new Error(
      "ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD are required before seeding the first admin.",
    );
  }

  if (password.length < 12) {
    throw new Error("ADMIN_BOOTSTRAP_PASSWORD must be at least 12 characters.");
  }

  return {
    email,
    name,
    passwordHash: await hashPassword(password),
  };
}

type SlugRecord = {
  id: string;
  slug: string;
};

function createRecordMap<T extends SlugRecord>(records: readonly T[]) {
  return new Map(records.map((record) => [record.slug, record] as const));
}

function getRequiredRecord<T extends SlugRecord>(
  recordsBySlug: Map<string, T>,
  slug: string,
  modelName: string,
) {
  const record = recordsBySlug.get(slug);

  if (!record) {
    throw new Error(`Missing ${modelName} seed record for slug "${slug}".`);
  }

  return record;
}

async function main() {
  const bootstrapAdmin = await getBootstrapAdmin();

  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.jobRun.deleteMany(),
    prisma.outboxEvent.deleteMany(),
    prisma.integrationJob.deleteMany(),
    prisma.webhookEvent.deleteMany(),
    prisma.productClickEvent.deleteMany(),
    prisma.productViewEvent.deleteMany(),
    prisma.searchEvent.deleteMany(),
    prisma.tryOnSession.deleteMany(),
    prisma.recommendationSession.deleteMany(),
    prisma.giftProfile.deleteMany(),
    prisma.styleProfile.deleteMany(),
    prisma.appointment.deleteMany(),
    prisma.returnRequest.deleteMany(),
    prisma.shipment.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.cart.deleteMany(),
    prisma.wishlistItem.deleteMany(),
    prisma.wishlist.deleteMany(),
    prisma.savedSize.deleteMany(),
    prisma.customerAddress.deleteMany(),
    prisma.otpChallenge.deleteMany(),
    prisma.newsletterSubscription.deleteMany(),
    prisma.customer.deleteMany(),
    prisma.inventoryReservation.deleteMany(),
    prisma.inventoryLedger.deleteMany(),
    prisma.inventoryItem.deleteMany(),
    prisma.price.deleteMany(),
    prisma.productMedia.deleteMany(),
    prisma.productVariant.deleteMany(),
    prisma.product.deleteMany(),
    prisma.collection.deleteMany(),
    prisma.category.deleteMany(),
    prisma.material.deleteMany(),
    prisma.stone.deleteMany(),
    prisma.adminUser.deleteMany(),
    prisma.role.deleteMany(),
    prisma.branch.deleteMany(),
  ]);

  const [categories, materials, stones, collections] = await Promise.all([
    Promise.all(
      seedCategories.map((category) =>
        prisma.category.create({ data: category }),
      ),
    ),
    Promise.all(
      seedMaterials.map((material) =>
        prisma.material.create({ data: material }),
      ),
    ),
    Promise.all(
      seedStones.map((stone) => prisma.stone.create({ data: stone })),
    ),
    Promise.all(
      seedCollections.map((collection) =>
        prisma.collection.create({ data: collection }),
      ),
    ),
  ]);

  const categoryBySlug = createRecordMap(categories);
  const materialBySlug = createRecordMap(materials);
  const stoneBySlug = createRecordMap(stones);
  const collectionBySlug = createRecordMap(collections);

  const [tlv, jerusalem] = await Promise.all([
    prisma.branch.create({
      data: {
        slug: "tel-aviv",
        name: "Aphrodite תל אביב",
        address: "דיזנגוף 148",
        city: "תל אביב",
        phone: "03-5550101",
        whatsapp: "97235550101",
        latitude: 32.0809,
        longitude: 34.7806,
        openingHours: {
          sundayThursday: "10:00-20:00",
          friday: "09:30-14:00",
          saturday: "סגור",
        },
        services: ["איסוף מהחנות", "מדידה", "ייעוץ מתנות", "שינוי מידה"],
      },
    }),
    prisma.branch.create({
      data: {
        slug: "jerusalem",
        name: "Aphrodite ירושלים",
        address: "ממילא 12",
        city: "ירושלים",
        phone: "02-5550101",
        whatsapp: "97225550101",
        latitude: 31.7767,
        longitude: 35.2248,
        openingHours: {
          sundayThursday: "10:00-19:00",
          friday: "09:30-13:30",
          saturday: "סגור",
        },
        services: ["איסוף מהחנות", "פגישת כלה", "ייעוץ יהלומים"],
      },
    }),
  ]);

  const products = getSeedProducts();

  for (const productData of products) {
    const category = getRequiredRecord(
      categoryBySlug,
      productData.categorySlug,
      "category",
    );
    const material = getRequiredRecord(
      materialBySlug,
      productData.materialSlug,
      "material",
    );
    const stone = productData.stoneSlug
      ? getRequiredRecord(stoneBySlug, productData.stoneSlug, "stone")
      : null;
    const productCollections = productData.collectionSlugs.map((slug) => ({
      id: getRequiredRecord(collectionBySlug, slug, "collection").id,
    }));

    await prisma.product.create({
      data: {
        slug: productData.slug,
        sku: productData.sku,
        name: productData.name,
        shortDescription: productData.shortDescription,
        description: productData.description,
        status: "ACTIVE",
        categoryId: category.id,
        materialId: material.id,
        stoneId: stone?.id ?? null,
        basePrice: productData.basePrice,
        careInstructions: "מומלץ להימנע ממגע עם בושם, כלור וחומרי ניקוי.",
        warranty: "אחריות לשנה על פגמי ייצור ושירות ניקוי ראשוני ללא עלות.",
        tags: productData.tags,
        collections: { connect: productCollections },
        media: {
          create: productData.images.map((url, index) => ({
            kind: "IMAGE",
            url,
            alt: productData.name,
            width: 1400,
            height: 1400,
            isPrimary: index === 0,
            sortOrder: index,
          })),
        },
        variants: {
          create: productData.variants.map((variantData, index) => ({
            sku: variantData.sku,
            name: variantData.name,
            size: variantData.size,
            metalColor: variantData.metalColor,
            stoneColor: variantData.stoneColor,
            priceDelta: variantData.priceDelta,
            isDefault: index === 0,
            prices: {
              create: {
                amount: productData.basePrice,
                currency: "ILS",
              },
            },
            inventoryItems: {
              create: [
                {
                  branchId: tlv.id,
                  quantity: variantData.quantityTlv,
                  reserved: 0,
                  safetyStock: variantData.safetyStock,
                },
                {
                  branchId: jerusalem.id,
                  quantity: variantData.quantityJerusalem,
                  reserved: 0,
                  safetyStock: variantData.safetyStock,
                },
              ],
            },
          })),
        },
      },
    });
  }

  const systemRole = await prisma.role.create({
    data: {
      name: "מנהל מערכת",
      permissions: [
        "SYSTEM",
        "CATALOG",
        "CATALOG_READ",
        "CATALOG_WRITE",
        "INVENTORY",
        "INVENTORY_READ",
        "INVENTORY_WRITE",
        "ORDERS",
        "ORDERS_READ",
        "ORDERS_WRITE",
        "ORDERS_REFUND",
        "CUSTOMER_SERVICE",
        "CUSTOMER_VIEW",
        "CUSTOMER_WRITE",
        "SYSTEM_CONFIG",
      ],
    },
  });

  await prisma.adminUser.create({
    data: {
      roleId: systemRole.id,
      name: bootstrapAdmin.name,
      email: bootstrapAdmin.email,
      passwordHash: bootstrapAdmin.passwordHash,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
