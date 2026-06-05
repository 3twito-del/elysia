export const PRODUCTS_PER_CATEGORY = 75;

export const seedCategories = [
  {
    slug: "rings",
    name: "טבעות",
    description: "טבעות זהב, יהלומים ואבני חן ליום יום ולאירועים.",
    sortOrder: 1,
  },
  {
    slug: "necklaces",
    name: "שרשראות",
    description: "שרשראות עדינות, תליונים וסטים משלימים.",
    sortOrder: 2,
  },
  {
    slug: "earrings",
    name: "עגילים",
    description: "עגילים מודרניים בזהב, פנינים ויהלומים בקו מאופק.",
    sortOrder: 3,
  },
  {
    slug: "bracelets",
    name: "צמידים",
    description: "צמידים נקיים עם נוכחות עדינה.",
    sortOrder: 4,
  },
] as const;

export const seedMaterials = [
  { slug: "yellow-gold", name: "זהב צהוב 14K" },
  { slug: "white-gold", name: "זהב לבן 14K" },
  { slug: "rose-gold", name: "זהב ורוד 14K" },
  { slug: "sterling-silver", name: "כסף סטרלינג 925" },
] as const;

export const seedStones = [
  { slug: "diamond", name: "יהלום" },
  { slug: "pearl", name: "פנינה" },
  { slug: "sapphire", name: "ספיר" },
  { slug: "emerald", name: "אמרלד" },
  { slug: "ruby", name: "רובי" },
  { slug: "onyx", name: "אוניקס" },
] as const;

export const seedCollections = [
  {
    slug: "studio-light",
    name: "אור רך",
    description: "קולקציית בסיס נקייה עם קווים דקים וזהב חם.",
    heroImageUrl: "/brand/boutique/lifestyle-hero.avif",
    isFeatured: true,
  },
  {
    slug: "bridal-edit",
    name: "בחירת כלה",
    description: "בחירות מדויקות להצעות, חתונות וסטים חגיגיים.",
    heroImageUrl: "/brand/boutique/category-rings.avif",
    isFeatured: true,
  },
  {
    slug: "daily-icons",
    name: "בחירות יומיות",
    description: "תכשיטים קלים לשילוב יומיומי עם גימור נקי.",
    heroImageUrl: "/brand/boutique/category-necklaces.avif",
    isFeatured: false,
  },
  {
    slug: "evening-glow",
    name: "זוהר ערב",
    description: "בחירות מבריקות לערב, אירועים ומתנות עם נוכחות.",
    heroImageUrl: "/brand/boutique/category-earrings.avif",
    isFeatured: false,
  },
  {
    slug: "gift-studio",
    name: "מתנות בשקט",
    description: "בחירות מוכנות למתנות לפי תקציב, סגנון ואירוע.",
    heroImageUrl: "/brand/boutique/category-bracelets.avif",
    isFeatured: false,
  },
] as const;

export type SeedCategorySlug = (typeof seedCategories)[number]["slug"];
export type SeedMaterialSlug = (typeof seedMaterials)[number]["slug"];
export type SeedStoneSlug = (typeof seedStones)[number]["slug"];
export type SeedCollectionSlug = (typeof seedCollections)[number]["slug"];

export type SeedProductVariant = {
  sku: string;
  name: string;
  size: string | null;
  metalColor: string | null;
  stoneColor: string | null;
  priceDelta: string;
  quantityTlv: number;
  quantityJerusalem: number;
  safetyStock: number;
};

export type SeedProduct = {
  slug: string;
  sku: string;
  name: string;
  shortDescription: string;
  description: string;
  categorySlug: SeedCategorySlug;
  materialSlug: SeedMaterialSlug;
  stoneSlug: SeedStoneSlug | null;
  basePrice: string;
  collectionSlugs: SeedCollectionSlug[];
  image: string;
  tags: string[];
  variants: SeedProductVariant[];
};

const manualProducts = [
  {
    slug: "venus-line-ring",
    sku: "ELY-RG-001",
    name: "טבעת Venus Line",
    shortDescription: "טבעת זהב דקה עם יהלום יחיד ונוכחות שקטה.",
    description:
      "טבעת יומיומית בעבודה נקייה. מתאימה כמתנה, טבעת שכבות או טבעת הצעה עדינה.",
    categorySlug: "rings",
    materialSlug: "yellow-gold",
    stoneSlug: "diamond",
    basePrice: "1290",
    collectionSlugs: ["studio-light", "bridal-edit"],
    image: "/brand/boutique/category-rings.avif",
    tags: ["דיוק מאופק", "קו מודרני", "אירוסין", "מתנה"],
    variants: [
      {
        sku: "ELY-RG-001-52",
        name: "מידה 52",
        size: "52",
        metalColor: "זהב צהוב",
        stoneColor: "לבן",
        priceDelta: "0",
        quantityTlv: 4,
        quantityJerusalem: 2,
        safetyStock: 1,
      },
      {
        sku: "ELY-RG-001-54",
        name: "מידה 54",
        size: "54",
        metalColor: "זהב צהוב",
        stoneColor: "לבן",
        priceDelta: "0",
        quantityTlv: 2,
        quantityJerusalem: 3,
        safetyStock: 1,
      },
    ],
  },
  {
    slug: "muse-pearl-earrings",
    sku: "ELY-ER-018",
    name: "עגילי Muse Pearl",
    shortDescription: "עגילי פנינה קטנים בזהב צהוב למראה נקי.",
    description:
      "עגילים קלאסיים בקו מודרני מאופק, עם פנינה טבעית ונעילה נוחה לשימוש יומיומי.",
    categorySlug: "earrings",
    materialSlug: "yellow-gold",
    stoneSlug: "pearl",
    basePrice: "690",
    collectionSlugs: ["studio-light"],
    image: "/brand/boutique/category-earrings.avif",
    tags: ["דיוק מאופק", "קו מודרני", "פנינה", "מתנה"],
    variants: [
      {
        sku: "ELY-ER-018-STD",
        name: "זוג עגילים",
        size: null,
        metalColor: "זהב צהוב",
        stoneColor: "פנינה",
        priceDelta: "0",
        quantityTlv: 8,
        quantityJerusalem: 5,
        safetyStock: 1,
      },
    ],
  },
  {
    slug: "selene-chain",
    sku: "ELY-NK-044",
    name: "שרשרת Selene",
    shortDescription: "שרשרת זהב לבן עם תליון אורכי דק.",
    description:
      "שרשרת מינימלית עם תליון אורכי, מתאימה ללבישה עצמאית או כחלק מסט שכבות.",
    categorySlug: "necklaces",
    materialSlug: "white-gold",
    stoneSlug: "diamond",
    basePrice: "980",
    collectionSlugs: ["studio-light"],
    image: "/brand/boutique/category-necklaces.avif",
    tags: ["דיוק מאופק", "קו מודרני", "שכבות", "מתנה"],
    variants: [
      {
        sku: "ELY-NK-044-42",
        name: "42 ס״מ",
        size: "42",
        metalColor: "זהב לבן",
        stoneColor: "לבן",
        priceDelta: "0",
        quantityTlv: 3,
        quantityJerusalem: 1,
        safetyStock: 1,
      },
      {
        sku: "ELY-NK-044-45",
        name: "45 ס״מ",
        size: "45",
        metalColor: "זהב לבן",
        stoneColor: "לבן",
        priceDelta: "0",
        quantityTlv: 1,
        quantityJerusalem: 4,
        safetyStock: 1,
      },
    ],
  },
  {
    slug: "hera-bracelet",
    sku: "ELY-BR-027",
    name: "צמיד Hera",
    shortDescription: "צמיד חוליות דק בזהב צהוב עם סגירה שטוחה.",
    description:
      "צמיד זהב נוח וקל, בנוי לשילוב עם שעון או צמידים נוספים בלי להעמיס על היד.",
    categorySlug: "bracelets",
    materialSlug: "yellow-gold",
    stoneSlug: null,
    basePrice: "840",
    collectionSlugs: ["studio-light"],
    image: "/brand/boutique/category-bracelets.avif",
    tags: ["דיוק מאופק", "קו מודרני", "יום יום", "שכבות"],
    variants: [
      {
        sku: "ELY-BR-027-S",
        name: "S",
        size: "S",
        metalColor: "זהב צהוב",
        stoneColor: null,
        priceDelta: "0",
        quantityTlv: 5,
        quantityJerusalem: 3,
        safetyStock: 1,
      },
      {
        sku: "ELY-BR-027-M",
        name: "M",
        size: "M",
        metalColor: "זהב צהוב",
        stoneColor: null,
        priceDelta: "0",
        quantityTlv: 2,
        quantityJerusalem: 2,
        safetyStock: 1,
      },
    ],
  },
] satisfies readonly SeedProduct[];

type CategoryBlueprint = {
  productKind: string;
  skuPrefix: string;
  generatedSlugPrefix: string;
  image: string;
  priceBase: number;
  priceStep: number;
  variantPriceStep: number;
  offset: number;
  sizeGroups: readonly (readonly string[])[];
  variantName: (size: string) => string;
  categoryTags: readonly string[];
};

const categoryBlueprints = {
  rings: {
    productKind: "טבעת",
    skuPrefix: "RG",
    generatedSlugPrefix: "ring",
    image: "/brand/boutique/category-rings.avif",
    priceBase: 690,
    priceStep: 65,
    variantPriceStep: 45,
    offset: 0,
    sizeGroups: [
      ["50", "52", "54"],
      ["52", "54", "56"],
      ["54", "56", "58"],
      ["48", "50", "52"],
    ],
    variantName: (size) => `מידה ${size}`,
    categoryTags: ["טבעת", "אירוסין", "שכבות"],
  },
  necklaces: {
    productKind: "שרשרת",
    skuPrefix: "NK",
    generatedSlugPrefix: "necklace",
    image: "/brand/boutique/category-necklaces.avif",
    priceBase: 620,
    priceStep: 55,
    variantPriceStep: 35,
    offset: 7,
    sizeGroups: [
      ["40", "42", "45"],
      ["42", "45", "50"],
      ["38", "40", "42"],
      ["45", "50", "55"],
    ],
    variantName: (size) => `${size} ס״מ`,
    categoryTags: ["שרשרת", "תליון", "שכבות"],
  },
  earrings: {
    productKind: "עגילי",
    skuPrefix: "ER",
    generatedSlugPrefix: "earrings",
    image: "/brand/boutique/category-earrings.avif",
    priceBase: 360,
    priceStep: 48,
    variantPriceStep: 30,
    offset: 13,
    sizeGroups: [
      ["מיני", "קלאסי"],
      ["סטוד", "תלוי"],
      ["קטן", "בינוני"],
      ["עגול", "ארוך"],
    ],
    variantName: (size) => `זוג ${size}`,
    categoryTags: ["עגילים", "קל משקל", "מתנה"],
  },
  bracelets: {
    productKind: "צמיד",
    skuPrefix: "BR",
    generatedSlugPrefix: "bracelet",
    image: "/brand/boutique/category-bracelets.avif",
    priceBase: 520,
    priceStep: 52,
    variantPriceStep: 40,
    offset: 19,
    sizeGroups: [
      ["S", "M", "L"],
      ["XS", "S", "M"],
      ["M", "L"],
      ["16", "18", "20"],
    ],
    variantName: (size) => size,
    categoryTags: ["צמיד", "יום יום", "שכבות"],
  },
} satisfies Record<SeedCategorySlug, CategoryBlueprint>;

const categoryImageVariants = {
  rings: [
    "/brand/boutique/category-rings.avif",
    "/brand/boutique/lifestyle-hero.avif",
    "/brand/boutique/category-necklaces.avif",
  ],
  necklaces: [
    "/brand/boutique/category-necklaces.avif",
    "/brand/boutique/lifestyle-hero.avif",
    "/brand/boutique/category-earrings.avif",
  ],
  earrings: [
    "/brand/boutique/category-earrings.avif",
    "/brand/boutique/lifestyle-hero.avif",
    "/brand/boutique/category-rings.avif",
  ],
  bracelets: [
    "/brand/boutique/category-bracelets.avif",
    "/brand/boutique/lifestyle-hero.avif",
    "/brand/boutique/category-rings.avif",
  ],
} satisfies Record<SeedCategorySlug, readonly string[]>;

const designFamilies = [
  { slug: "aura", name: "Aura", hebrew: "הילה", tags: ["עדין", "יום יום"] },
  { slug: "noya", name: "Noya", hebrew: "נויה", tags: ["נקי", "מתנה"] },
  { slug: "luna", name: "Luna", hebrew: "ירח", tags: ["ערב", "מבריק"] },
  { slug: "iris", name: "Iris", hebrew: "איריס", tags: ["צבעוני", "נשי"] },
  { slug: "maya", name: "Maya", hebrew: "מאיה", tags: ["קלאסי", "עדין"] },
  { slug: "daphne", name: "Daphne", hebrew: "דפנה", tags: ["אלגנטי", "אירוע"] },
  { slug: "noor", name: "Noor", hebrew: "אור", tags: ["מודרני", "קל"] },
  { slug: "gaia", name: "Gaia", hebrew: "גאיה", tags: ["טבעי", "אבן חן"] },
  { slug: "ariel", name: "Ariel", hebrew: "אריאל", tags: ["מאופק", "נקי"] },
  { slug: "eden", name: "Eden", hebrew: "עדן", tags: ["רך", "מתנה"] },
  { slug: "lyra", name: "Lyra", hebrew: "לירה", tags: ["קו נקי", "ערב"] },
  { slug: "talia", name: "Talia", hebrew: "טליה", tags: ["יומיומי", "שכבות"] },
  { slug: "mika", name: "Mika", hebrew: "מיקה", tags: ["מינימלי", "קל"] },
  { slug: "sivan", name: "Sivan", hebrew: "סיון", tags: ["חגיגי", "מתנה"] },
  { slug: "alma", name: "Alma", hebrew: "עלמה", tags: ["רומנטי", "אירוסין"] },
  {
    slug: "zohar",
    name: "Zohar",
    hebrew: "זוהר",
    tags: ["מבריק", "אור רך"],
  },
] as const;

const designDetails = [
  { slug: "line", hebrew: "קו דק", tags: ["מינימלי"] },
  { slug: "halo", hebrew: "הילה פתוחה", tags: ["מבריק"] },
  { slug: "wave", hebrew: "גל עדין", tags: ["רך"] },
  { slug: "dot", hebrew: "נקודת אור", tags: ["עדין"] },
  { slug: "leaf", hebrew: "עלה קטן", tags: ["טבעי"] },
  { slug: "bar", hebrew: "פס נקי", tags: ["מודרני"] },
  { slug: "drop", hebrew: "טיפה", tags: ["אירוע"] },
  { slug: "twist", hebrew: "פיתול", tags: ["שכבות"] },
  { slug: "signet", hebrew: "חותם רך", tags: ["קלאסי"] },
  { slug: "cluster", hebrew: "אשכול עדין", tags: ["אבן חן"] },
  { slug: "beam", hebrew: "קרן אור", tags: ["ערב"] },
  { slug: "classic", hebrew: "קלאסי", tags: ["יומיומי"] },
] as const;

const materialPremium = {
  "yellow-gold": 170,
  "white-gold": 210,
  "rose-gold": 190,
  "sterling-silver": 0,
} satisfies Record<SeedMaterialSlug, number>;

const materialColors = {
  "yellow-gold": "זהב צהוב",
  "white-gold": "זהב לבן",
  "rose-gold": "זהב ורוד",
  "sterling-silver": "כסף",
} satisfies Record<SeedMaterialSlug, string>;

const stonePremium = {
  diamond: 460,
  pearl: 160,
  sapphire: 280,
  emerald: 310,
  ruby: 300,
  onyx: 120,
} satisfies Record<SeedStoneSlug, number>;

const stoneColors = {
  diamond: "לבן",
  pearl: "פנינה",
  sapphire: "כחול",
  emerald: "ירוק",
  ruby: "אדום",
  onyx: "שחור",
} satisfies Record<SeedStoneSlug, string>;

export function getSeedProducts(): SeedProduct[] {
  const products: SeedProduct[] = [...manualProducts];

  for (const category of seedCategories) {
    const existingProducts = products.filter(
      (product) => product.categorySlug === category.slug,
    ).length;
    const missingProducts = PRODUCTS_PER_CATEGORY - existingProducts;

    for (let index = 1; index <= missingProducts; index += 1) {
      products.push(createGeneratedProduct(category.slug, index));
    }
  }

  return products;
}

function createGeneratedProduct(
  categorySlug: SeedCategorySlug,
  index: number,
): SeedProduct {
  const blueprint = categoryBlueprints[categorySlug];
  const family = pick(designFamilies, index + blueprint.offset);
  const detail = pick(designDetails, index * 3 + blueprint.offset);
  const material = pick(seedMaterials, index + blueprint.offset);
  const stone =
    index % 6 === 0 ? null : pick(seedStones, index + blueprint.offset);
  const collection = pick(seedCollections, index + blueprint.offset);
  const serial = String(index + 100).padStart(3, "0");
  const sku = `ELY-${blueprint.skuPrefix}-T${serial}`;
  const basePrice =
    blueprint.priceBase +
    (index % 12) * blueprint.priceStep +
    materialPremium[material.slug] +
    (stone ? stonePremium[stone.slug] : 0);
  const collectionSlugs = createCollectionSlugs(
    collection.slug,
    categorySlug,
    index,
  );
  const stoneText = stone ? `עם ${stone.name}` : "ללא אבן";
  const name = `${blueprint.productKind} ${family.hebrew} ${detail.hebrew}`;
  const description = createGeneratedProductDescription({
    materialName: material.name,
    name,
    stoneName: stone?.name,
  });

  return {
    slug: `${blueprint.generatedSlugPrefix}-${family.slug}-${detail.slug}-${serial}`,
    sku,
    name,
    shortDescription: `${blueprint.productKind} ${material.name} ${stoneText} בגימור ${detail.hebrew}.`,
    description,
    categorySlug,
    materialSlug: material.slug,
    stoneSlug: stone?.slug ?? null,
    basePrice: String(basePrice),
    collectionSlugs,
    image: pick(categoryImageVariants[categorySlug], index + blueprint.offset),
    tags: createTags({
      blueprint,
      collectionSlugs,
      detailTags: detail.tags,
      familyTags: family.tags,
      materialName: material.name,
      stoneName: stone?.name,
      index,
    }),
    variants: createVariants({
      blueprint,
      index,
      materialSlug: material.slug,
      sku,
      stoneSlug: stone?.slug ?? null,
    }),
  };
}

function createCollectionSlugs(
  primarySlug: SeedCollectionSlug,
  categorySlug: SeedCategorySlug,
  index: number,
) {
  const collectionSlugs: SeedCollectionSlug[] = [primarySlug];

  if (categorySlug === "rings" && index % 5 === 0) {
    collectionSlugs.push("bridal-edit");
  }

  if (index % 7 === 0) {
    collectionSlugs.push("gift-studio");
  }

  return Array.from(new Set(collectionSlugs));
}

function createTags(input: {
  blueprint: CategoryBlueprint;
  collectionSlugs: readonly SeedCollectionSlug[];
  detailTags: readonly string[];
  familyTags: readonly string[];
  materialName: string;
  stoneName?: string;
  index: number;
}) {
  return Array.from(
    new Set([
      ...input.blueprint.categoryTags,
      ...input.detailTags,
      ...input.familyTags,
      input.materialName,
      input.stoneName ?? "ללא אבן",
      "אור רך",
      ...(input.collectionSlugs.includes("gift-studio") || input.index % 4 === 0
        ? ["מתנה"]
        : []),
      ...(input.collectionSlugs.includes("bridal-edit") ? ["אירוסין"] : []),
    ]),
  );
}

function createGeneratedProductDescription(input: {
  materialName: string;
  name: string;
  stoneName?: string;
}) {
  const stoneText = input.stoneName ? ` עם ${input.stoneName}` : "";

  return `${input.name} משלב ${input.materialName}${stoneText} בקו נקי ונוח לענידה. מתאים לשילוב יומיומי, מתנה או אירוע, עם פרטי מידה, חומר ומחיר שמוצגים בשפה ברורה.`;
}

function createVariants(input: {
  blueprint: CategoryBlueprint;
  index: number;
  materialSlug: SeedMaterialSlug;
  sku: string;
  stoneSlug: SeedStoneSlug | null;
}): SeedProductVariant[] {
  const sizes = pick(
    input.blueprint.sizeGroups,
    input.index + input.blueprint.offset,
  );

  return sizes.map((size, variantIndex) => ({
    sku: `${input.sku}-V${variantIndex + 1}`,
    name: input.blueprint.variantName(size),
    size,
    metalColor: materialColors[input.materialSlug],
    stoneColor: input.stoneSlug ? stoneColors[input.stoneSlug] : null,
    priceDelta: String(variantIndex * input.blueprint.variantPriceStep),
    quantityTlv: 2 + ((input.index + variantIndex) % 9),
    quantityJerusalem: 1 + ((input.index + variantIndex * 2) % 7),
    safetyStock: input.index % 5 === 0 ? 2 : 1,
  }));
}

function pick<T>(values: readonly T[], index: number): T {
  const value = values[index % values.length];

  if (value === undefined) {
    throw new Error("Cannot pick from an empty seed array.");
  }

  return value;
}
