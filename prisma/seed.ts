import { PrismaClient } from "@prisma/client";

import { hashPassword } from "../src/server/auth/password";
import { siteContact, siteWhatsapp } from "../src/config/site-contact";
import {
  getSeedProducts,
  seedCategories,
  seedCollections,
  seedMaterials,
  seedStones,
} from "./seed-catalog";
import {
  fixtureBlogAuthor,
  fixtureBlogCategories,
  fixtureBlogPosts,
  fixtureBlogTags,
} from "../src/server/services/blog-fixtures";
import { DEFAULT_CHART_OF_ACCOUNTS } from "../src/server/services/ledger-accounts";

const prisma = new PrismaClient();

async function getBootstrapAdmin() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const configuredName = process.env.ADMIN_BOOTSTRAP_NAME?.trim();
  const name =
    configuredName && configuredName.length > 0
      ? configuredName
      : "Elysia Admin";

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

type SeedAvailabilityMode = "READY_TO_ORDER" | "MADE_TO_ORDER" | "CONSULTATION";

function getSeedAvailabilityMode(slug: string): SeedAvailabilityMode {
  if (slug === "muse-pearl-earrings") return "MADE_TO_ORDER";
  if (slug === "venus-line-ring") return "CONSULTATION";

  return "READY_TO_ORDER";
}

function getSeedCommerceHighlights(slug: string) {
  if (slug === "muse-pearl-earrings") {
    return ["פרטי ההתאמה יאושרו מראש", "הכנה אישית במידה ובגוון"];
  }

  if (slug === "venus-line-ring") {
    return ["שיחת התאמה לפני הבחירה", "אבן שנבחנה בקפידה"];
  }

  return ["פרטים מאומתים לפני הזמנה", "נבדק בקפידה לפני מסירה"];
}

async function seedBlogContent(adminUserId: string) {
  await prisma.blogAuthor.create({
    data: {
      id: fixtureBlogAuthor.id,
      slug: fixtureBlogAuthor.slug,
      name: fixtureBlogAuthor.name,
      title: fixtureBlogAuthor.title,
      bio: fixtureBlogAuthor.bio,
      imageUrl: fixtureBlogAuthor.imageUrl,
      createdAt: fixtureBlogAuthor.createdAt,
      updatedAt: fixtureBlogAuthor.updatedAt,
    },
  });

  await prisma.blogCategory.createMany({
    data: fixtureBlogCategories.map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
      description: category.description,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    })),
  });

  await prisma.blogTag.createMany({
    data: fixtureBlogTags.map((tag) => ({
      id: tag.id,
      slug: tag.slug,
      name: tag.name,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    })),
  });

  for (const post of fixtureBlogPosts) {
    await prisma.blogPost.create({
      data: {
        id: post.id,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        bodyMarkdown: post.bodyMarkdown,
        status: post.status,
        publishedAt: post.publishedAt,
        heroImageUrl: post.heroImageUrl,
        heroImageAlt: post.heroImageAlt,
        seoTitle: post.seoTitle,
        seoDescription: post.seoDescription,
        featured: post.featured,
        authorId: post.author.id,
        categoryId: post.category.id,
        createdByAdminUserId: adminUserId,
        updatedByAdminUserId: adminUserId,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        tags: { connect: post.tags.map((tag) => ({ id: tag.id })) },
      },
    });
  }
}

async function seedLedgerAccounts() {
  for (const account of DEFAULT_CHART_OF_ACCOUNTS) {
    await prisma.ledgerAccount.upsert({
      where: { code: account.code },
      create: account,
      update: {
        name: account.name,
        type: account.type,
        normalSide: account.normalSide,
      },
    });
  }
}

async function main() {
  const bootstrapAdmin = await getBootstrapAdmin();

  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.jobRun.deleteMany(),
    prisma.outboxEvent.deleteMany(),
    prisma.integrationJob.deleteMany(),
    prisma.webhookEvent.deleteMany(),
    prisma.financeLedgerEntry.deleteMany(),
    prisma.productCostSnapshot.deleteMany(),
    prisma.goodsReceipt.deleteMany(),
    prisma.purchaseOrderItem.deleteMany(),
    prisma.purchaseOrder.deleteMany(),
    prisma.vendor.deleteMany(),
    prisma.campaignAudienceSnapshot.deleteMany(),
    prisma.campaign.deleteMany(),
    prisma.customerSegmentMembership.deleteMany(),
    prisma.customerSegment.deleteMany(),
    prisma.customerTask.deleteMany(),
    prisma.customerNote.deleteMany(),
    prisma.customerMetricSnapshot.deleteMany(),
    prisma.productDailyMetric.deleteMany(),
    prisma.funnelDailyMetric.deleteMany(),
    prisma.analyticsDailyAggregate.deleteMany(),
    prisma.analyticsEvent.deleteMany(),
    prisma.shopifyOrderMirror.deleteMany(),
    prisma.productClickEvent.deleteMany(),
    prisma.productViewEvent.deleteMany(),
    prisma.searchEvent.deleteMany(),
    prisma.tryOnSession.deleteMany(),
    prisma.recommendationSession.deleteMany(),
    prisma.serviceRequestAttachment.deleteMany(),
    prisma.serviceRequest.deleteMany(),
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
    prisma.blogPost.deleteMany(),
    prisma.blogTag.deleteMany(),
    prisma.blogCategory.deleteMany(),
    prisma.blogAuthor.deleteMany(),
    prisma.productMedia.deleteMany(),
    prisma.productVariant.deleteMany(),
    prisma.product.deleteMany(),
    prisma.collection.deleteMany(),
    prisma.category.deleteMany(),
    prisma.material.deleteMany(),
    prisma.stone.deleteMany(),
    prisma.adminUser.deleteMany(),
    prisma.role.deleteMany(),
    prisma.contactTopic.deleteMany(),
    prisma.serviceSettings.deleteMany(),
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

  await prisma.serviceSettings.create({
    data: {
      id: "default",
      phoneE164: siteContact.phoneE164,
      displayPhone: siteContact.phoneDisplay,
      serviceEmail: siteContact.email,
      physicalBranchesEnabled: false,
    },
  });

  await prisma.contactTopic.createMany({
    data: [
      {
        id: "topic_general",
        slug: "general",
        label: "פנייה כללית",
        description: "שאלה או בקשה שאינה משויכת לנושא אחר.",
        sortOrder: 10,
      },
      {
        id: "topic_order",
        slug: "order",
        label: "הזמנה קיימת",
        description: "בירור, עדכון או שאלה לגבי הזמנה.",
        sortOrder: 20,
      },
      {
        id: "topic_repair",
        slug: "repair",
        label: "תיקון",
        description: "בקשה לבדיקת תיקון, אחריות או טיפול בתכשיט.",
        sortOrder: 30,
      },
      {
        id: "topic_returns",
        slug: "returns",
        label: "החלפה או החזרה",
        description: "בקשה להחלפה, החזרה או זיכוי.",
        sortOrder: 40,
      },
      {
        id: "topic_sizing",
        slug: "sizing",
        label: "מידה והתאמה",
        description: "ייעוץ מידה, התאמה או בחירת מתנה.",
        sortOrder: 50,
      },
      {
        id: "topic_accessibility_privacy",
        slug: "accessibility-privacy",
        label: "נגישות ופרטיות",
        description: "פנייה בנושא נגישות, פרטיות או מידע אישי.",
        sortOrder: 60,
      },
      {
        id: "topic_partnership",
        slug: "partnership",
        label: "שיתוף פעולה",
        description: "פנייה ל-Elysia, תוכן או שיתוף פעולה.",
        sortOrder: 70,
      },
    ],
  });

  const [onlineService] = await Promise.all([
    prisma.branch.create({
      data: {
        slug: "online-service",
        name: "שירות מרחוק",
        address: "Online",
        city: "Online",
        phone: siteContact.phoneDisplay,
        whatsapp: siteWhatsapp,
        openingHours: {
          sundayThursday: "10:00-18:00",
          friday: "09:30-13:00",
          saturday: "סגור",
        },
        services: ["שירות מרחוק", "מענה טלפוני", "תיאום תיקונים"],
        kind: "ONLINE",
        isApproved: true,
        isPublic: false,
        isActive: true,
        sortOrder: 0,
      },
    }),
    prisma.branch.create({
      data: {
        slug: "tel-aviv",
        name: "Elysia תל אביב",
        address: "דיזנגוף 148",
        city: "תל אביב",
        phone: "03-5550101",
        whatsapp: "97235550101",
        latitude: 32.0809,
        longitude: 34.7806,
        kind: "PHYSICAL",
        isApproved: false,
        isPublic: false,
        isActive: true,
        sortOrder: 10,
        openingHours: {
          sundayThursday: "10:00-20:00",
          friday: "09:30-14:00",
          saturday: "סגור",
        },
        services: ["איסוף מ-Elysia", "מדידה", "ייעוץ מתנות", "שינוי מידה"],
      },
    }),
    prisma.branch.create({
      data: {
        slug: "jerusalem",
        name: "Elysia ירושלים",
        address: "ממילא 12",
        city: "ירושלים",
        phone: "02-5550101",
        whatsapp: "97225550101",
        latitude: 31.7767,
        longitude: 35.2248,
        kind: "PHYSICAL",
        isApproved: false,
        isPublic: false,
        isActive: true,
        sortOrder: 20,
        openingHours: {
          sundayThursday: "10:00-19:00",
          friday: "09:30-13:30",
          saturday: "סגור",
        },
        services: ["איסוף מ-Elysia", "ייעוץ כלה", "ייעוץ יהלומים"],
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
        availabilityMode: getSeedAvailabilityMode(productData.slug),
        commerceHighlights: getSeedCommerceHighlights(productData.slug),
        deliveryPromise: "מסירה עד הבית לאחר אישור הפרטים.",
        returnPolicy: "החלפה או החזרה בתיאום אישי לפי מדיניות Elysia.",
        careInstructions: "מומלץ להימנע ממגע עם בושם, כלור וחומרי ניקוי.",
        warranty: "אחריות לשנה על פגמי ייצור ושירות ניקוי ראשוני ללא עלות.",
        tags: productData.tags,
        collections: { connect: productCollections },
        media: {
          create: {
            kind: "IMAGE",
            url: productData.image,
            alt: productData.name,
            width: 1400,
            height: 1400,
            isPrimary: true,
            role: "PRIMARY",
            sortOrder: 0,
          },
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
                  branchId: onlineService.id,
                  quantity:
                    variantData.quantityTlv + variantData.quantityJerusalem,
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

  await prisma.customerSegment.createMany({
    data: [
      {
        key: "vip_customers",
        name: "לקוחות VIP",
        description: "לקוחות עם ערך הזמנות גבוה או רכישות חוזרות.",
        rule: { kind: "rfm", minLifetimeValue: 2500, minOrders: 2 },
      },
      {
        key: "high_intent",
        name: "כוונת רכישה גבוהה",
        description: "לקוחות עם Wishlist, צפיות מוצר או התחלת Checkout.",
        rule: { kind: "behavior", signals: ["wishlist", "cart", "checkout"] },
      },
      {
        key: "dormant",
        name: "לקוחות רדומים",
        description: "לקוחות שלא רכשו או פנו בתקופה האחרונה.",
        rule: { kind: "recency", inactiveDays: 90 },
      },
      {
        key: "abandoned_cart",
        name: "עגלה נטושה",
        description: "לקוחות עם עגלה פעילה ללא הזמנה.",
        rule: { kind: "cart", activeWithoutOrderHours: 24 },
      },
      {
        key: "service_risk",
        name: "סיכון שירות",
        description: "לקוחות עם פניות שירות פתוחות או חוזרות.",
        rule: { kind: "service", openRequests: true },
      },
    ],
  });

  const vendor = await prisma.vendor.create({
    data: {
      key: "elysia-studio",
      name: "Elysia Studio",
      contactEmail: siteContact.email,
      paymentTerms: "שוטף + 30",
      leadTimeDays: 14,
      metadata: {
        kind: "internal_workshop",
        operationalUse: "Seed vendor for ERP and margin snapshots.",
      },
    },
  });

  const seededProducts = await prisma.product.findMany({
    select: {
      id: true,
      basePrice: true,
      variants: { select: { id: true, isDefault: true } },
    },
  });

  await prisma.productCostSnapshot.createMany({
    data: seededProducts.map((product) => {
      const defaultVariant =
        product.variants.find((variant) => variant.isDefault) ??
        product.variants[0];

      return {
        productId: product.id,
        variantId: defaultVariant?.id ?? null,
        vendorId: vendor.id,
        unitCost: Math.round(Number(product.basePrice) * 0.38 * 100) / 100,
        currency: "ILS",
        source: "seed",
        metadata: { marginModel: "estimated_seed_cost" },
      };
    }),
  });

  const systemRole = await prisma.role.create({
    data: {
      name: "מנהל מערכת",
      permissions: [
        "SYSTEM",
        "BLOG",
        "BLOG_READ",
        "BLOG_WRITE",
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
        "ANALYTICS_READ",
        "CRM_READ",
        "CRM_WRITE",
        "ERP_READ",
        "ERP_WRITE",
        "FINANCE_READ",
        "SYSTEM_CONFIG",
      ],
    },
  });

  const adminUser = await prisma.adminUser.create({
    data: {
      roleId: systemRole.id,
      name: bootstrapAdmin.name,
      email: bootstrapAdmin.email,
      passwordHash: bootstrapAdmin.passwordHash,
    },
  });

  await seedBlogContent(adminUser.id);
  await seedLedgerAccounts();
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
