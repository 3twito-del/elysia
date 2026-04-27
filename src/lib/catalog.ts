export type CategorySlug = "rings" | "necklaces" | "earrings" | "bracelets";

export type Branch = {
  slug: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  whatsapp: string;
  services: string[];
  openingHours: {
    sundayThursday: string;
    friday: string;
    saturday: string;
  };
};

export type Product = {
  slug: string;
  sku: string;
  name: string;
  categorySlug: CategorySlug;
  categoryName: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAt?: number;
  material: string;
  stone?: string;
  collection: string;
  image: string;
  metalColors: string[];
  sizes: string[];
  tags: string[];
  inventory: Record<string, number>;
};

export const categories: Array<{
  slug: CategorySlug;
  name: string;
  description: string;
}> = [
  {
    slug: "rings",
    name: "טבעות",
    description: "טבעות זהב, יהלומים ואבני חן ליום יום ולאירועים.",
  },
  {
    slug: "necklaces",
    name: "שרשראות",
    description: "שרשראות עדינות, תליונים וסטים משלימים.",
  },
  {
    slug: "earrings",
    name: "עגילים",
    description: "עגילי סטודיו מודרניים בזהב, פנינים ויהלומים.",
  },
  {
    slug: "bracelets",
    name: "צמידים",
    description: "צמידים נקיים עם נוכחות עדינה.",
  },
];

export const branches: Branch[] = [
  {
    slug: "tel-aviv",
    name: "Aphrodite תל אביב",
    city: "תל אביב",
    address: "דיזנגוף 148",
    phone: "03-5550101",
    whatsapp: "97235550101",
    services: ["איסוף מהחנות", "מדידה", "ייעוץ מתנות", "שינוי מידה"],
    openingHours: {
      sundayThursday: "10:00-20:00",
      friday: "09:30-14:00",
      saturday: "סגור",
    },
  },
  {
    slug: "jerusalem",
    name: "Aphrodite ירושלים",
    city: "ירושלים",
    address: "ממילא 12",
    phone: "02-5550101",
    whatsapp: "97225550101",
    services: ["איסוף מהחנות", "פגישת כלה", "ייעוץ יהלומים"],
    openingHours: {
      sundayThursday: "10:00-19:00",
      friday: "09:30-13:30",
      saturday: "סגור",
    },
  },
];

export const products: Product[] = [
  {
    slug: "venus-line-ring",
    sku: "APH-RG-001",
    name: "טבעת Venus Line",
    categorySlug: "rings",
    categoryName: "טבעות",
    shortDescription: "טבעת זהב דקה עם יהלום יחיד ונוכחות שקטה.",
    description:
      "טבעת יומיומית בעבודת סטודיו נקייה. מתאימה כמתנה, טבעת שכבות או טבעת הצעה עדינה.",
    price: 1290,
    material: "זהב צהוב 14K",
    stone: "יהלום",
    collection: "Studio Light",
    image:
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1400&q=80",
    metalColors: ["זהב צהוב"],
    sizes: ["52", "54", "56"],
    tags: ["אירוסין", "מתנה", "יוקרה נגישה"],
    inventory: { "tel-aviv": 6, jerusalem: 5 },
  },
  {
    slug: "muse-pearl-earrings",
    sku: "APH-ER-018",
    name: "עגילי Muse Pearl",
    categorySlug: "earrings",
    categoryName: "עגילים",
    shortDescription: "עגילי פנינה קטנים בזהב צהוב למראה נקי.",
    description:
      "עגילים קלאסיים במראה סטודיו מודרני, עם פנינה טבעית ונעילה נוחה לשימוש יומיומי.",
    price: 690,
    material: "זהב צהוב 14K",
    stone: "פנינה",
    collection: "Studio Light",
    image:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1400&q=80",
    metalColors: ["זהב צהוב"],
    sizes: ["זוג"],
    tags: ["פנינים", "יום יום", "מתנה"],
    inventory: { "tel-aviv": 8, jerusalem: 5 },
  },
  {
    slug: "selene-chain",
    sku: "APH-NK-044",
    name: "שרשרת Selene",
    categorySlug: "necklaces",
    categoryName: "שרשראות",
    shortDescription: "שרשרת זהב לבן עם תליון אורכי דק.",
    description:
      "שרשרת מינימלית עם תליון אורכי, מתאימה ללבישה עצמאית או כחלק מסט שכבות.",
    price: 980,
    compareAt: 1180,
    material: "זהב לבן 14K",
    stone: "יהלום",
    collection: "Studio Light",
    image:
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1400&q=80",
    metalColors: ["זהב לבן"],
    sizes: ["42 ס״מ", "45 ס״מ"],
    tags: ["שכבות", "יהלום", "מינימלי"],
    inventory: { "tel-aviv": 4, jerusalem: 5 },
  },
  {
    slug: "hera-bracelet",
    sku: "APH-BR-027",
    name: "צמיד Hera",
    categorySlug: "bracelets",
    categoryName: "צמידים",
    shortDescription: "צמיד חוליות דק בזהב צהוב עם סגירה שטוחה.",
    description:
      "צמיד זהב נוח וקל, בנוי לשילוב עם שעון או צמידים נוספים בלי להעמיס על היד.",
    price: 840,
    material: "זהב צהוב 14K",
    collection: "Studio Light",
    image:
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=1400&q=80",
    metalColors: ["זהב צהוב"],
    sizes: ["S", "M"],
    tags: ["צמידים", "יום יום", "שכבות"],
    inventory: { "tel-aviv": 7, jerusalem: 5 },
  },
];

export function formatPrice(amount: number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getProductsByCategory(slug?: string) {
  if (!slug) return products;

  return products.filter((product) => product.categorySlug === slug);
}

export function searchProducts({
  query,
  category,
  branch,
  maxPrice,
}: {
  query?: string;
  category?: string;
  branch?: string;
  maxPrice?: number;
}) {
  const normalizedQuery = query?.trim().toLowerCase();

  return products.filter((product) => {
    const matchesQuery =
      !normalizedQuery ||
      [
        product.name,
        product.shortDescription,
        product.material,
        product.stone,
        product.collection,
        ...product.tags,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    const matchesCategory = !category || product.categorySlug === category;
    const matchesBranch = !branch || (product.inventory[branch] ?? 0) > 0;
    const matchesPrice = !maxPrice || product.price <= maxPrice;

    return matchesQuery && matchesCategory && matchesBranch && matchesPrice;
  });
}

export function getAvailability(product: Product) {
  return branches.map((branch) => ({
    branch,
    quantity: product.inventory[branch.slug] ?? 0,
    available: (product.inventory[branch.slug] ?? 0) > 0,
  }));
}

export function getFeaturedProducts() {
  return products.slice(0, 4);
}
