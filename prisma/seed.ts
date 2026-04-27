import { PrismaClient } from "@prisma/client";

import { hashPassword } from "../src/server/auth/password";

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

async function main() {
  const bootstrapAdmin = await getBootstrapAdmin();

  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.integrationJob.deleteMany(),
    prisma.webhookEvent.deleteMany(),
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

  const [rings, necklaces, earrings, bracelets] = await Promise.all([
    prisma.category.create({
      data: {
        slug: "rings",
        name: "טבעות",
        description: "טבעות זהב, יהלומים ואבני חן ליום יום ולאירועים.",
        sortOrder: 1,
      },
    }),
    prisma.category.create({
      data: {
        slug: "necklaces",
        name: "שרשראות",
        description: "שרשראות עדינות, תליונים וסטים משלימים.",
        sortOrder: 2,
      },
    }),
    prisma.category.create({
      data: {
        slug: "earrings",
        name: "עגילים",
        description: "עגילי סטודיו מודרניים בזהב, פנינים ויהלומים.",
        sortOrder: 3,
      },
    }),
    prisma.category.create({
      data: {
        slug: "bracelets",
        name: "צמידים",
        description: "צמידים נקיים עם נוכחות עדינה.",
        sortOrder: 4,
      },
    }),
  ]);

  const [gold, whiteGold, pearl, diamond] = await Promise.all([
    prisma.material.create({
      data: { slug: "yellow-gold", name: "זהב צהוב 14K" },
    }),
    prisma.material.create({
      data: { slug: "white-gold", name: "זהב לבן 14K" },
    }),
    prisma.stone.create({ data: { slug: "pearl", name: "פנינה" } }),
    prisma.stone.create({ data: { slug: "diamond", name: "יהלום" } }),
  ]);

  const [studio, bridal] = await Promise.all([
    prisma.collection.create({
      data: {
        slug: "studio-light",
        name: "Studio Light",
        description: "קולקציית בסיס נקייה עם קווים דקים וזהב חם.",
        heroImageUrl:
          "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1600&q=80",
        isFeatured: true,
      },
    }),
    prisma.collection.create({
      data: {
        slug: "bridal-edit",
        name: "Bridal Edit",
        description: "בחירות מדויקות להצעות, חתונות וסטים חגיגיים.",
        heroImageUrl:
          "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1600&q=80",
        isFeatured: true,
      },
    }),
  ]);

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

  const products = [
    {
      slug: "venus-line-ring",
      sku: "APH-RG-001",
      name: "טבעת Venus Line",
      shortDescription: "טבעת זהב דקה עם יהלום יחיד ונוכחות שקטה.",
      description:
        "טבעת יומיומית בעבודת סטודיו נקייה. מתאימה כמתנה, טבעת שכבות או טבעת הצעה עדינה.",
      categoryId: rings.id,
      materialId: gold.id,
      stoneId: diamond.id,
      basePrice: "1290",
      collections: [studio.id, bridal.id],
      image:
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1400&q=80",
      variants: [
        {
          sku: "APH-RG-001-52",
          name: "מידה 52",
          size: "52",
          quantityTlv: 4,
          quantityJerusalem: 2,
        },
        {
          sku: "APH-RG-001-54",
          name: "מידה 54",
          size: "54",
          quantityTlv: 2,
          quantityJerusalem: 3,
        },
      ],
    },
    {
      slug: "muse-pearl-earrings",
      sku: "APH-ER-018",
      name: "עגילי Muse Pearl",
      shortDescription: "עגילי פנינה קטנים בזהב צהוב למראה נקי.",
      description:
        "עגילים קלאסיים במראה סטודיו מודרני, עם פנינה טבעית ונעילה נוחה לשימוש יומיומי.",
      categoryId: earrings.id,
      materialId: gold.id,
      stoneId: pearl.id,
      basePrice: "690",
      collections: [studio.id],
      image:
        "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1400&q=80",
      variants: [
        {
          sku: "APH-ER-018-STD",
          name: "זוג עגילים",
          size: null,
          quantityTlv: 8,
          quantityJerusalem: 5,
        },
      ],
    },
    {
      slug: "selene-chain",
      sku: "APH-NK-044",
      name: "שרשרת Selene",
      shortDescription: "שרשרת זהב לבן עם תליון אורכי דק.",
      description:
        "שרשרת מינימלית עם תליון אורכי, מתאימה ללבישה עצמאית או כחלק מסט שכבות.",
      categoryId: necklaces.id,
      materialId: whiteGold.id,
      stoneId: diamond.id,
      basePrice: "980",
      collections: [studio.id],
      image:
        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1400&q=80",
      variants: [
        {
          sku: "APH-NK-044-42",
          name: "42 ס״מ",
          size: "42",
          quantityTlv: 3,
          quantityJerusalem: 1,
        },
        {
          sku: "APH-NK-044-45",
          name: "45 ס״מ",
          size: "45",
          quantityTlv: 1,
          quantityJerusalem: 4,
        },
      ],
    },
    {
      slug: "hera-bracelet",
      sku: "APH-BR-027",
      name: "צמיד Hera",
      shortDescription: "צמיד חוליות דק בזהב צהוב עם סגירה שטוחה.",
      description:
        "צמיד זהב נוח וקל, בנוי לשילוב עם שעון או צמידים נוספים בלי להעמיס על היד.",
      categoryId: bracelets.id,
      materialId: gold.id,
      stoneId: null,
      basePrice: "840",
      collections: [studio.id],
      image:
        "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=1400&q=80",
      variants: [
        {
          sku: "APH-BR-027-S",
          name: "S",
          size: "S",
          quantityTlv: 5,
          quantityJerusalem: 3,
        },
        {
          sku: "APH-BR-027-M",
          name: "M",
          size: "M",
          quantityTlv: 2,
          quantityJerusalem: 2,
        },
      ],
    },
  ];

  for (const productData of products) {
    const product = await prisma.product.create({
      data: {
        slug: productData.slug,
        sku: productData.sku,
        name: productData.name,
        shortDescription: productData.shortDescription,
        description: productData.description,
        status: "ACTIVE",
        categoryId: productData.categoryId,
        materialId: productData.materialId,
        stoneId: productData.stoneId,
        basePrice: productData.basePrice,
        careInstructions: "מומלץ להימנע ממגע עם בושם, כלור וחומרי ניקוי.",
        warranty: "אחריות לשנה על פגמי ייצור ושירות ניקוי ראשוני ללא עלות.",
        tags: ["יוקרה נגישה", "סטודיו מודרני"],
        collections: { connect: productData.collections.map((id) => ({ id })) },
        media: {
          create: {
            kind: "IMAGE",
            url: productData.image,
            alt: productData.name,
            width: 1400,
            height: 1400,
          },
        },
      },
    });

    for (const [index, variantData] of productData.variants.entries()) {
      const variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: variantData.sku,
          name: variantData.name,
          size: variantData.size,
          isDefault: index === 0,
          prices: {
            create: {
              amount: productData.basePrice,
              currency: "ILS",
            },
          },
        },
      });

      await prisma.inventoryItem.createMany({
        data: [
          {
            branchId: tlv.id,
            variantId: variant.id,
            quantity: variantData.quantityTlv,
            reserved: 0,
            safetyStock: 1,
          },
          {
            branchId: jerusalem.id,
            variantId: variant.id,
            quantity: variantData.quantityJerusalem,
            reserved: 0,
            safetyStock: 1,
          },
        ],
      });
    }
  }

  const systemRole = await prisma.role.create({
    data: {
      name: "מנהל מערכת",
      permissions: [
        "SYSTEM",
        "CATALOG",
        "INVENTORY",
        "ORDERS",
        "CUSTOMER_SERVICE",
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
