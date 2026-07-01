import { seedSilverIsraelProductImages } from "./seed-silver-israel-images";

const PRODUCT_CATALOG_IMAGE_COUNT = 16;
const PRODUCT_CATALOG_IMAGE_ORDER = [
  10, 1, 6, 7, 4, 15, 2, 11, 3, 0, 9, 12, 14, 13, 8, 5,
] as const;
const PRODUCT_MEDIA_ROLES = [
  "PRIMARY",
  "ALTERNATE",
  "SCALE",
  "CONSTRUCTION",
  "MATERIAL",
  "CONTEXT",
] as const;
const SET_IMAGE_CATEGORIES = [
  "necklaces",
  "earrings",
  "bracelets",
  "rings",
] as const;
const SUPPLIER_KEY = "silver-israel";

export const seedCategories = [
  {
    slug: "rings",
    name: "טבעות",
    description: "טבעות כסף 925 וציפוי זהב מתוך עריכת Silver Israel ל-Elysia.",
    imageUrl: "/brand/boutique/category-rings.avif",
    sortOrder: 1,
  },
  {
    slug: "necklaces",
    name: "שרשראות",
    description: "שרשראות ותליונים בכסף, ציפוי זהב, פנינים וקווי טניס עדינים.",
    imageUrl: "/brand/boutique/category-necklaces.avif",
    sortOrder: 2,
  },
  {
    slug: "earrings",
    name: "עגילים",
    description: "עגילים צמודים, חישוקים וטיפות בקו נקי לשימוש יומי ומתנה.",
    imageUrl: "/brand/boutique/category-earrings.avif",
    sortOrder: 3,
  },
  {
    slug: "bracelets",
    name: "צמידים",
    description: "צמידי טניס וקווים עדינים בכסף ובציפוי זהב.",
    imageUrl: "/brand/boutique/category-bracelets.avif",
    sortOrder: 4,
  },
  {
    slug: "sets",
    name: "סטים",
    description: "סטים ערוכים של שרשרת ועגילים למתנה, ערב או כלה.",
    imageUrl: "/brand/boutique/product-detail.avif",
    sortOrder: 5,
  },
] as const;

export const seedMaterials = [
  { slug: "sterling-silver", name: "כסף 925" },
  {
    slug: "gold-plated-sterling-silver",
    name: "ציפוי זהב על כסף 925",
  },
  {
    slug: "rose-gold-plated-sterling-silver",
    name: "ציפוי רוז גולד על כסף 925",
  },
] as const;

export const seedStones = [
  { slug: "zircon", name: "זירקון" },
  { slug: "pearl", name: "פנינה" },
] as const;

export const seedCollections = [
  {
    slug: "essentials",
    name: "Essentials",
    description: "פריטי בסיס נקיים לענידה יומיומית.",
    heroImageUrl: "/brand/boutique/lifestyle-hero.avif",
    isFeatured: true,
  },
  {
    slug: "timeless",
    name: "Timeless",
    description: "בחירות קלאסיות עם קו עדין ויציב.",
    heroImageUrl: "/brand/boutique/product-detail.avif",
    isFeatured: true,
  },
  {
    slug: "minimal",
    name: "Minimal",
    description: "צלליות דקות ומדויקות למראה שקט.",
    heroImageUrl: "/brand/boutique/category-rings.avif",
    isFeatured: false,
  },
  {
    slug: "hearts",
    name: "Hearts",
    description: "לבבות קטנים ומתנות רכות.",
    heroImageUrl: "/brand/boutique/category-necklaces.avif",
    isFeatured: false,
  },
  {
    slug: "everyday-luxury",
    name: "Everyday Luxury",
    description: "ברק יומיומי במידה מאופקת.",
    heroImageUrl: "/brand/boutique/category-bracelets.avif",
    isFeatured: true,
  },
  {
    slug: "pearls",
    name: "Pearls",
    description: "פנינים בקו מודרני ונקי.",
    heroImageUrl: "/brand/boutique/category-earrings.avif",
    isFeatured: true,
  },
  {
    slug: "tennis",
    name: "Tennis",
    description: "קווי טניס עדינים לערב וליום.",
    heroImageUrl: "/brand/boutique/category-bracelets.avif",
    isFeatured: false,
  },
  {
    slug: "drops",
    name: "Drops",
    description: "טיפות ותנועה רכה ליד הפנים.",
    heroImageUrl: "/brand/boutique/category-earrings.avif",
    isFeatured: false,
  },
  {
    slug: "bridal",
    name: "Bridal",
    description: "סטים ובחירות לכלה, אירוע ומתנה משמעותית.",
    heroImageUrl: "/brand/boutique/category-rings.avif",
    isFeatured: false,
  },
  {
    slug: "gifts",
    name: "Gifts",
    description: "פריטים נוחים לבחירה כמתנה.",
    heroImageUrl: "/brand/boutique/lifestyle-hero-poster.avif",
    isFeatured: false,
  },
] as const;

export type SeedCategorySlug = (typeof seedCategories)[number]["slug"];
export type SeedMaterialSlug = (typeof seedMaterials)[number]["slug"];
export type SeedStoneSlug = (typeof seedStones)[number]["slug"];
export type SeedCollectionSlug = (typeof seedCollections)[number]["slug"];
export type SeedProductMediaRole = (typeof PRODUCT_MEDIA_ROLES)[number];

export type SeedProductMedia = {
  alt: string;
  role: SeedProductMediaRole;
  sortOrder: number;
  url: string;
};

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
  images: string[];
  media: SeedProductMedia[];
  tags: string[];
  sourceCode: string;
  sourceHandle: string;
  sourceUrl: string;
  supplierKey: typeof SUPPLIER_KEY;
  variants: SeedProductVariant[];
};

type SilverIsraelCategory =
  | "טבעת"
  | "שרשרת"
  | "עגילים"
  | "צמיד"
  | "סט";
type SilverIsraelFinish = "כסף" | "זהב" | "רוז גולד";
type SilverIsraelRole = "Hero / Best Seller" | "Featured" | "Catalog";

type SilverIsraelCatalogRow = {
  category: SilverIsraelCategory;
  collection: string;
  finish: SilverIsraelFinish;
  index: number;
  name: string;
  role: SilverIsraelRole;
  sourceName: string;
  sourceUrl: string;
};

const silverIsraelCatalogRows = [
  { index: 1, category: "טבעת", collection: "Essentials", name: "Elysia Grace Ring", sourceName: "טבעת CSI012-2", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%98%D7%91%D7%A2%D7%AA-csi012-2/", role: "Hero / Best Seller" },
  { index: 2, category: "טבעת", collection: "Timeless", name: "Elysia Luna Ring", sourceName: "טבעת CSI027-1", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%98%D7%91%D7%A2%D7%AA-csi027-1/", role: "Hero / Best Seller" },
  { index: 3, category: "טבעת", collection: "Minimal", name: "Elysia Halo Ring", sourceName: "טבעת FLSI021-1", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%98%D7%91%D7%A2%D7%AA-flsi021-1/", role: "Hero / Best Seller" },
  { index: 4, category: "טבעת", collection: "Hearts", name: "Elysia Serene Ring", sourceName: "טבעת FLSI5012-3", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%98%D7%91%D7%A2%D7%AA-flsi5012-3/", role: "Hero / Best Seller" },
  { index: 5, category: "טבעת", collection: "Everyday Luxury", name: "Elysia Alba Ring", sourceName: "טבעת FLSI5013-1", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%98%D7%91%D7%A2%D7%AA-flsi5013-1/", role: "Hero / Best Seller" },
  { index: 6, category: "טבעת", collection: "Essentials", name: "Elysia Nora Ring", sourceName: "טבעת FLSI5013-3", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%98%D7%91%D7%A2%D7%AA-flsi5013-3/", role: "Hero / Best Seller" },
  { index: 7, category: "טבעת", collection: "Timeless", name: "Elysia Isla Ring", sourceName: "טבעת FLSI7016-1", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%98%D7%91%D7%A2%D7%AA-flsi7016-1/", role: "Hero / Best Seller" },
  { index: 8, category: "טבעת", collection: "Minimal", name: "Elysia Clara Ring", sourceName: "טבעת FLSI7016-3", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%98%D7%91%D7%A2%D7%AA-flsi7016-3/", role: "Hero / Best Seller" },
  { index: 9, category: "טבעת", collection: "Hearts", name: "Elysia Belle Ring", sourceName: "טבעת KSI2028-1", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%98%D7%91%D7%A2%D7%AA-ksi2028-1/", role: "Hero / Best Seller" },
  { index: 10, category: "טבעת", collection: "Everyday Luxury", name: "Elysia Aurea Ring", sourceName: "טבעת KSI2028-2", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%98%D7%91%D7%A2%D7%AA-ksi2028-2/", role: "Hero / Best Seller" },
  { index: 11, category: "טבעת", collection: "Essentials", name: "Elysia Grace Ring", sourceName: "טבעת KSI3023-2", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%98%D7%91%D7%A2%D7%AA-ksi3023-2/", role: "Hero / Best Seller" },
  { index: 12, category: "טבעת", collection: "Timeless", name: "Elysia Luna Ring", sourceName: "טבעת KSI3023-3", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%98%D7%91%D7%A2%D7%AA-ksi3023-3/", role: "Hero / Best Seller" },
  { index: 13, category: "טבעת", collection: "Minimal", name: "Elysia Halo Ring", sourceName: "טבעת KSI3024-1", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%98%D7%91%D7%A2%D7%AA-ksi3024-1/", role: "Featured" },
  { index: 14, category: "טבעת", collection: "Hearts", name: "Elysia Serene Ring", sourceName: "טבעת KSI3024-2", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%98%D7%91%D7%A2%D7%AA-ksi3024-2/", role: "Featured" },
  { index: 15, category: "טבעת", collection: "Everyday Luxury", name: "Elysia Alba Ring", sourceName: "טבעת KSI3039-1", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%98%D7%91%D7%A2%D7%AA-ksi3039-1/", role: "Featured" },
  { index: 16, category: "טבעת", collection: "Essentials", name: "Elysia Nora Ring", sourceName: "טבעת KSI3039-3", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%98%D7%91%D7%A2%D7%AA-ksi3039-3/", role: "Featured" },
  { index: 17, category: "טבעת", collection: "Timeless", name: "Elysia Isla Ring", sourceName: "טבעת KSI3042-1", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%98%D7%91%D7%A2%D7%AA-ksi3042-1/", role: "Featured" },
  { index: 18, category: "טבעת", collection: "Minimal", name: "Elysia Clara Ring", sourceName: "טבעת KSI3042-2", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%98%D7%91%D7%A2%D7%AA-ksi3042-2/", role: "Featured" },
  { index: 19, category: "טבעת", collection: "Hearts", name: "Elysia Belle Ring", sourceName: "טבעת KSI3042-3", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%98%D7%91%D7%A2%D7%AA-ksi3042-3/", role: "Featured" },
  { index: 20, category: "טבעת", collection: "Everyday Luxury", name: "Elysia Aurea Ring", sourceName: "טבעת KSI3043-1", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%98%D7%91%D7%A2%D7%AA-ksi3043-1/", role: "Featured" },
  { index: 21, category: "טבעת", collection: "Essentials", name: "Elysia Grace Ring", sourceName: "טבעת KSI3043-2", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%98%D7%91%D7%A2%D7%AA-ksi3043-2/", role: "Featured" },
  { index: 22, category: "טבעת", collection: "Timeless", name: "Elysia Luna Ring", sourceName: "טבעת KSI3043-3", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%98%D7%91%D7%A2%D7%AA-ksi3043-3/", role: "Featured" },
  { index: 23, category: "טבעת", collection: "Minimal", name: "Elysia Halo Ring", sourceName: "טבעת KSI3046-1", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%98%D7%91%D7%A2%D7%AA-ksi3046-1/", role: "Featured" },
  { index: 24, category: "טבעת", collection: "Hearts", name: "Elysia Serene Ring", sourceName: "טבעת KSI3046-2", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%98%D7%91%D7%A2%D7%AA-ksi3046-2/", role: "Featured" },
  { index: 25, category: "טבעת", collection: "Everyday Luxury", name: "Elysia Alba Ring", sourceName: "טבעת KSI4004-1", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%98%D7%91%D7%A2%D7%AA-ksi4004-1/", role: "Featured" },
  { index: 26, category: "טבעת", collection: "Essentials", name: "Elysia Nora Ring", sourceName: "טבעת KSI4005-1", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%98%D7%91%D7%A2%D7%AA-ksi4005-1/", role: "Featured" },
  { index: 27, category: "טבעת", collection: "Timeless", name: "Elysia Isla Ring", sourceName: "טבעת KSI4008-1", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%98%D7%91%D7%A2%D7%AA-ksi4008-1/", role: "Featured" },
  { index: 28, category: "טבעת", collection: "Minimal", name: "Elysia Clara Ring", sourceName: "טבעת KSI4010-1", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%98%D7%91%D7%A2%D7%AA-ksi4010-1/", role: "Featured" },
  { index: 29, category: "טבעת", collection: "Hearts", name: "Elysia Belle Ring", sourceName: "טבעת KSI4012-2", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%98%D7%91%D7%A2%D7%AA-ksi4012-2/", role: "Featured" },
  { index: 30, category: "טבעת", collection: "Everyday Luxury", name: "Elysia Aurea Ring", sourceName: "טבעת KSI4013-1", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%98%D7%91%D7%A2%D7%AA-ksi4013-1/", role: "Featured" },
  { index: 31, category: "שרשרת", collection: "Timeless", name: "Elysia Aurora Necklace", sourceName: "שרשרת CSI040-1", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%A9%D7%A8%D7%A9%D7%A8%D7%AA-csi040-1/", role: "Featured" },
  { index: 32, category: "שרשרת", collection: "Tennis", name: "Elysia Celeste Necklace", sourceName: "שרשרת CSI040-2", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%A9%D7%A8%D7%A9%D7%A8%D7%AA-csi040-2/", role: "Hero / Best Seller" },
  { index: 33, category: "שרשרת", collection: "Pearls", name: "Elysia Pearl Necklace", sourceName: "שרשרת FLSI7017-3", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%A9%D7%A8%D7%A9%D7%A8%D7%AA-flsi7017-3/", role: "Hero / Best Seller" },
  { index: 34, category: "שרשרת", collection: "Hearts", name: "Elysia Muse Necklace", sourceName: "שרשרת 3mm SHSI017", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%A9%D7%A8%D7%A9%D7%A8%D7%AA-3mm-shsi017/", role: "Featured" },
  { index: 35, category: "שרשרת", collection: "Everyday Luxury", name: "Elysia Elara Necklace", sourceName: "שרשרת 3mm SHSI018", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%A9%D7%A8%D7%A9%D7%A8%D7%AA-3mm-shsi018/", role: "Featured" },
  { index: 36, category: "שרשרת", collection: "Timeless", name: "Elysia Diana Necklace", sourceName: "שרשרת 3mm SHSI019", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%A9%D7%A8%D7%A9%D7%A8%D7%AA-3mm-shsi019/", role: "Featured" },
  { index: 37, category: "שרשרת", collection: "Tennis", name: "Elysia Iris Necklace", sourceName: "שרשרת 5mm SHSI021", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%A9%D7%A8%D7%A9%D7%A8%D7%AA-5mm-shsi021/", role: "Featured" },
  { index: 38, category: "שרשרת", collection: "Pearls", name: "Elysia Noelle Necklace", sourceName: "שרשרת 5mm SHSI022", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%A9%D7%A8%D7%A9%D7%A8%D7%AA-5mm-shsi022/", role: "Featured" },
  { index: 39, category: "שרשרת", collection: "Hearts", name: "Elysia Soleil Necklace", sourceName: "שרשרת 5mm SHSI024", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%A9%D7%A8%D7%A9%D7%A8%D7%AA-5mm-shsi024/", role: "Featured" },
  { index: 40, category: "שרשרת", collection: "Everyday Luxury", name: "Elysia Vera Necklace", sourceName: "שרשרת COSI8002-3", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%A9%D7%A8%D7%A9%D7%A8%D7%AA-cosi8002-3/", role: "Featured" },
  { index: 41, category: "שרשרת", collection: "Timeless", name: "Elysia Aurora Necklace", sourceName: "שרשרת csi006-2", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%A9%D7%A8%D7%A9%D7%A8%D7%AA-csi006-2/", role: "Featured" },
  { index: 42, category: "שרשרת", collection: "Tennis", name: "Elysia Celeste Necklace", sourceName: "שרשרת CSI014-2", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%A9%D7%A8%D7%A9%D7%A8%D7%AA-csi014-2/", role: "Featured" },
  { index: 43, category: "שרשרת", collection: "Pearls", name: "Elysia Pearl Necklace", sourceName: "שרשרת CSI015-2", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%A9%D7%A8%D7%A9%D7%A8%D7%AA-csi015-2/", role: "Featured" },
  { index: 44, category: "שרשרת", collection: "Hearts", name: "Elysia Muse Necklace", sourceName: "שרשרת CSI015-3", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%A9%D7%A8%D7%A9%D7%A8%D7%AA-csi015-3/", role: "Featured" },
  { index: 45, category: "שרשרת", collection: "Everyday Luxury", name: "Elysia Elara Necklace", sourceName: "שרשרת CSI063-1", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%A9%D7%A8%D7%A9%D7%A8%D7%AA-csi063-1/", role: "Featured" },
  { index: 46, category: "שרשרת", collection: "Timeless", name: "Elysia Diana Necklace", sourceName: "שרשרת CSI100-2", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%A9%D7%A8%D7%A9%D7%A8%D7%AA-csi100-2/", role: "Catalog" },
  { index: 47, category: "שרשרת", collection: "Tennis", name: "Elysia Iris Necklace", sourceName: "שרשרת CSI104-1", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%A9%D7%A8%D7%A9%D7%A8%D7%AA-csi104-1/", role: "Catalog" },
  { index: 48, category: "שרשרת", collection: "Pearls", name: "Elysia Noelle Necklace", sourceName: "שרשרת CSI104-2", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%A9%D7%A8%D7%A9%D7%A8%D7%AA-csi104-2/", role: "Catalog" },
  { index: 49, category: "שרשרת", collection: "Hearts", name: "Elysia Soleil Necklace", sourceName: "שרשרת CSI106-1", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%A9%D7%A8%D7%A9%D7%A8%D7%AA-csi106-1/", role: "Catalog" },
  { index: 50, category: "שרשרת", collection: "Everyday Luxury", name: "Elysia Vera Necklace", sourceName: "שרשרת קולייר טניס כסף", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%A9%D7%A8%D7%A9%D7%A8%D7%AA-%D7%A7%D7%95%D7%9C%D7%99%D7%99%D7%A8-%D7%98%D7%A0%D7%99%D7%A1-%D7%9B%D7%A1%D7%A3/", role: "Catalog" },
  { index: 51, category: "שרשרת", collection: "Timeless", name: "Elysia Aurora Necklace", sourceName: "שרשרת קולייר טניס ציפוי", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%A9%D7%A8%D7%A9%D7%A8%D7%AA-%D7%A7%D7%95%D7%9C%D7%99%D7%99%D7%A8-%D7%98%D7%A0%D7%99%D7%A1-%D7%A6%D7%99%D7%A4%D7%95%D7%99/", role: "Catalog" },
  { index: 52, category: "שרשרת", collection: "Tennis", name: "Elysia Celeste Necklace", sourceName: "שרשרת פנינים עדינה", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%A9%D7%A8%D7%A9%D7%A8%D7%AA-%D7%A4%D7%A0%D7%99%D7%A0%D7%99%D7%9D-%D7%A2%D7%93%D7%99%D7%A0%D7%94/", role: "Catalog" },
  { index: 53, category: "שרשרת", collection: "Pearls", name: "Elysia Pearl Necklace", sourceName: "שרשרת לב עדינה", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%A9%D7%A8%D7%A9%D7%A8%D7%AA-%D7%9C%D7%91-%D7%A2%D7%93%D7%99%D7%A0%D7%94/", role: "Catalog" },
  { index: 54, category: "שרשרת", collection: "Hearts", name: "Elysia Muse Necklace", sourceName: "שרשרת טיפה עדינה", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%A9%D7%A8%D7%A9%D7%A8%D7%AA-%D7%98%D7%99%D7%A4%D7%94-%D7%A2%D7%93%D7%99%D7%A0%D7%94/", role: "Catalog" },
  { index: 55, category: "עגילים", collection: "Essentials", name: "Elysia Halo Earrings", sourceName: "CSI054-1", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/csi054-1/", role: "Catalog" },
  { index: 56, category: "עגילים", collection: "Pearls", name: "Elysia Pearl Earrings", sourceName: "YXSI1016-1", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/yxsi1016-1/", role: "Hero / Best Seller" },
  { index: 57, category: "עגילים", collection: "Drops", name: "Elysia Dew Earrings", sourceName: "עגיל LOZ1052-1", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%A2%D7%92%D7%99%D7%9C-loz1052-1/", role: "Catalog" },
  { index: 58, category: "עגילים", collection: "Minimal", name: "Elysia Lumi Earrings", sourceName: "עגיל LOZ1052-2", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%A2%D7%92%D7%99%D7%9C-loz1052-2/", role: "Catalog" },
  { index: 59, category: "עגילים", collection: "Everyday Luxury", name: "Elysia Ariel Earrings", sourceName: "עגיל zsi504-1", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%A2%D7%92%D7%99%D7%9C-zsi504-1/", role: "Catalog" },
  { index: 60, category: "עגילים", collection: "Essentials", name: "Elysia Celine Earrings", sourceName: "עגיל ZSI508-2 רוז גולד", finish: "רוז גולד", sourceUrl: "https://silverisrael.co.il/product/%D7%A2%D7%92%D7%99%D7%9C-zsi508-2-%D7%A8%D7%95%D7%96-%D7%92%D7%95%D7%9C%D7%93/", role: "Catalog" },
  { index: 61, category: "עגילים", collection: "Pearls", name: "Elysia Daphne Earrings", sourceName: "עגיל ZSI964-1", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%A2%D7%92%D7%99%D7%9C-zsi964-1/", role: "Catalog" },
  { index: 62, category: "עגילים", collection: "Drops", name: "Elysia Mira Earrings", sourceName: "עגיל ZSI035-3", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%A2%D7%92%D7%99%D7%9C-zsi035-3/", role: "Catalog" },
  { index: 63, category: "עגילים", collection: "Minimal", name: "Elysia Opal Earrings", sourceName: "עגיל 3-10 מ״מ ZSI2001-1", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%A2%D7%92%D7%99%D7%9C-3-10-%D7%9E%D7%B4%D7%9E-zsi2001-1/", role: "Catalog" },
  { index: 64, category: "עגילים", collection: "Everyday Luxury", name: "Elysia Rhea Earrings", sourceName: "עגיל 3-10 מ״מ ZSI2001-2", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%A2%D7%92%D7%99%D7%9C-3-10-%D7%9E%D7%B4%D7%9E-zsi2001-2/", role: "Catalog" },
  { index: 65, category: "עגילים", collection: "Essentials", name: "Elysia Halo Earrings", sourceName: "עגיל 3-10 מ״מ ZSI2001-3", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%A2%D7%92%D7%99%D7%9C-3-10-%D7%9E%D7%B4%D7%9E-zsi2001-3/", role: "Catalog" },
  { index: 66, category: "עגילים", collection: "Pearls", name: "Elysia Pearl Earrings", sourceName: "עגיל 6.5 מ״מ ZSI676-3", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%A2%D7%92%D7%99%D7%9C-6.5-%D7%9E%D7%B4%D7%9E-zsi676-3/", role: "Catalog" },
  { index: 67, category: "עגילים", collection: "Drops", name: "Elysia Dew Earrings", sourceName: "עגיל COSI8028-1", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%A2%D7%92%D7%99%D7%9C-cosi8028-1/", role: "Catalog" },
  { index: 68, category: "עגילים", collection: "Minimal", name: "Elysia Lumi Earrings", sourceName: "עגיל COSI8028-2", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%A2%D7%92%D7%99%D7%9C-cosi8028-2/", role: "Catalog" },
  { index: 69, category: "עגילים", collection: "Everyday Luxury", name: "Elysia Ariel Earrings", sourceName: "עגיל COSI8028-3", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%A2%D7%92%D7%99%D7%9C-cosi8028-3/", role: "Catalog" },
  { index: 70, category: "עגילים", collection: "Essentials", name: "Elysia Celine Earrings", sourceName: "עגיל CSI081-2", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%A2%D7%92%D7%99%D7%9C-csi081-2/", role: "Catalog" },
  { index: 71, category: "עגילים", collection: "Pearls", name: "Elysia Daphne Earrings", sourceName: "עגיל CSI090-1", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%A2%D7%92%D7%99%D7%9C-csi090-1/", role: "Catalog" },
  { index: 72, category: "עגילים", collection: "Drops", name: "Elysia Mira Earrings", sourceName: "עגיל חישוק עדין כסף", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%A2%D7%92%D7%99%D7%9C-%D7%97%D7%99%D7%A9%D7%95%D7%A7-%D7%A2%D7%93%D7%99%D7%9F-%D7%9B%D7%A1%D7%A3/", role: "Catalog" },
  { index: 73, category: "עגילים", collection: "Minimal", name: "Elysia Opal Earrings", sourceName: "עגיל חישוק עדין זהב", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%A2%D7%92%D7%99%D7%9C-%D7%97%D7%99%D7%A9%D7%95%D7%A7-%D7%A2%D7%93%D7%99%D7%9F-%D7%96%D7%94%D7%91/", role: "Catalog" },
  { index: 74, category: "עגילים", collection: "Everyday Luxury", name: "Elysia Rhea Earrings", sourceName: "עגילי פנינה צמודים", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%A2%D7%92%D7%99%D7%9C%D7%99-%D7%A4%D7%A0%D7%99%D7%A0%D7%94-%D7%A6%D7%9E%D7%95%D7%93%D7%99%D7%9D/", role: "Catalog" },
  { index: 75, category: "צמיד", collection: "Tennis", name: "Elysia Tennis Bracelet", sourceName: "צמיד ZSI667-1 4 MM", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%A6%D7%9E%D7%99%D7%93-zsi667-1-4-mm/", role: "Hero / Best Seller" },
  { index: 76, category: "צמיד", collection: "Essentials", name: "Elysia Luxe Bracelet", sourceName: "צמיד 8.5MM TSI5002-2", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%A6%D7%9E%D7%99%D7%93-8.5mm-tsi5002-2/", role: "Catalog" },
  { index: 77, category: "צמיד", collection: "Everyday Luxury", name: "Elysia Line Bracelet", sourceName: "צמיד 8.5MM TSI5002-3", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%A6%D7%9E%D7%99%D7%93-8.5mm-tsi5002-3/", role: "Catalog" },
  { index: 78, category: "צמיד", collection: "Minimal", name: "Elysia Luna Bracelet", sourceName: "צמיד CSI086-2", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%A6%D7%9E%D7%99%D7%93-csi086-2/", role: "Catalog" },
  { index: 79, category: "צמיד", collection: "Timeless", name: "Elysia Grace Bracelet", sourceName: "צמיד CSI105-1", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%A6%D7%9E%D7%99%D7%93-csi105-1/", role: "Catalog" },
  { index: 80, category: "צמיד", collection: "Tennis", name: "Elysia Nora Bracelet", sourceName: "צמיד CSI105-2", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%A6%D7%9E%D7%99%D7%93-csi105-2/", role: "Hero / Best Seller" },
  { index: 81, category: "צמיד", collection: "Essentials", name: "Elysia Ivy Bracelet", sourceName: "צמיד CSI108-2", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%A6%D7%9E%D7%99%D7%93-csi108-2/", role: "Catalog" },
  { index: 82, category: "צמיד", collection: "Everyday Luxury", name: "Elysia Astra Bracelet", sourceName: "צמיד ESI163-2", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%A6%D7%9E%D7%99%D7%93-esi163-2/", role: "Catalog" },
  { index: 83, category: "צמיד", collection: "Minimal", name: "Elysia Mila Bracelet", sourceName: "צמיד ESI169-1 2mm", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%A6%D7%9E%D7%99%D7%93-esi169-1-2mm/", role: "Catalog" },
  { index: 84, category: "צמיד", collection: "Timeless", name: "Elysia Eden Bracelet", sourceName: "צמיד ESI170-2 2mm", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%A6%D7%9E%D7%99%D7%93-esi170-2-2mm/", role: "Catalog" },
  { index: 85, category: "צמיד", collection: "Tennis", name: "Elysia Tennis Bracelet", sourceName: "צמיד ESI171-4 2mm", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%A6%D7%9E%D7%99%D7%93-esi171-4-2mm/", role: "Catalog" },
  { index: 86, category: "צמיד", collection: "Essentials", name: "Elysia Luxe Bracelet", sourceName: "צמיד ESI172-3 2mm", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%A6%D7%9E%D7%99%D7%93-esi172-3-2mm/", role: "Catalog" },
  { index: 87, category: "צמיד", collection: "Everyday Luxury", name: "Elysia Line Bracelet", sourceName: "צמיד ESI173-6 2mm", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%A6%D7%9E%D7%99%D7%93-esi173-6-2mm/", role: "Catalog" },
  { index: 88, category: "צמיד", collection: "Minimal", name: "Elysia Luna Bracelet", sourceName: "צמיד ESI175-2 3mm", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%A6%D7%9E%D7%99%D7%93-esi175-2-3mm/", role: "Catalog" },
  { index: 89, category: "צמיד", collection: "Timeless", name: "Elysia Grace Bracelet", sourceName: "צמיד ESI176-4 3mm", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%A6%D7%9E%D7%99%D7%93-esi176-4-3mm/", role: "Catalog" },
  { index: 90, category: "צמיד", collection: "Tennis", name: "Elysia Nora Bracelet", sourceName: "צמיד ESI177-3 3mm", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%A6%D7%9E%D7%99%D7%93-esi177-3-3mm/", role: "Catalog" },
  { index: 91, category: "צמיד", collection: "Essentials", name: "Elysia Ivy Bracelet", sourceName: "צמיד ESI178-6 3mm", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%A6%D7%9E%D7%99%D7%93-esi178-6-3mm/", role: "Catalog" },
  { index: 92, category: "צמיד", collection: "Everyday Luxury", name: "Elysia Astra Bracelet", sourceName: "צמיד ESI179-1 4mm", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%A6%D7%9E%D7%99%D7%93-esi179-1-4mm/", role: "Catalog" },
  { index: 93, category: "צמיד", collection: "Minimal", name: "Elysia Mila Bracelet", sourceName: "צמיד טניס כסף", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/%D7%A6%D7%9E%D7%99%D7%93-%D7%98%D7%A0%D7%99%D7%A1-%D7%9B%D7%A1%D7%A3/", role: "Catalog" },
  { index: 94, category: "צמיד", collection: "Timeless", name: "Elysia Eden Bracelet", sourceName: "צמיד טניס ציפוי זהב", finish: "זהב", sourceUrl: "https://silverisrael.co.il/product/%D7%A6%D7%9E%D7%99%D7%93-%D7%98%D7%A0%D7%99%D7%A1-%D7%A6%D7%99%D7%A4%D7%95%D7%99-%D7%96%D7%94%D7%91/", role: "Catalog" },
  { index: 95, category: "סט", collection: "Gifts", name: "Elysia Bridal Set", sourceName: "סט SI014 שרשרת", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/si014-%d7%a1%d7%98-%d7%a9%d7%a8%d7%a9%d7%a8%d7%aa/", role: "Catalog" },
  { index: 96, category: "סט", collection: "Bridal", name: "Elysia Signature Set", sourceName: "סט SI008 שרשרת", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/si008-%d7%a1%d7%98-%d7%a9%d7%a8%d7%a9%d7%a8%d7%aa/", role: "Hero / Best Seller" },
  { index: 97, category: "סט", collection: "Timeless", name: "Elysia Grace Set", sourceName: "סט SI009 שרשרת", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/si009-%d7%a1%d7%98-%d7%a9%d7%a8%d7%a9%d7%a8%d7%aa/", role: "Catalog" },
  { index: 98, category: "סט", collection: "Pearls", name: "Elysia Pearl Set", sourceName: "סט SI011 שרשרת", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/si011-%d7%a1%d7%98-%d7%a9%d7%a8%d7%a9%d7%a8%d7%aa/", role: "Hero / Best Seller" },
  { index: 99, category: "סט", collection: "Everyday Luxury", name: "Elysia Halo Set", sourceName: "סט Y014", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/y014-%d7%a1%d7%98/", role: "Catalog" },
  { index: 100, category: "סט", collection: "Gifts", name: "Elysia Classic Set", sourceName: "סט Y011", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/y011%d7%a1%d7%98/", role: "Catalog" },
  { index: 101, category: "סט", collection: "Bridal", name: "Elysia Luna Set", sourceName: "סט Y010", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/y010-0%d7%a1%d7%98/", role: "Catalog" },
  { index: 102, category: "סט", collection: "Timeless", name: "Elysia Muse Set", sourceName: "סט Y008", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/y008-%d7%a1%d7%98/", role: "Catalog" },
  { index: 103, category: "סט", collection: "Pearls", name: "Elysia Timeless Set", sourceName: "סט Y007", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/y007-%d7%a1%d7%98/", role: "Catalog" },
  { index: 104, category: "סט", collection: "Everyday Luxury", name: "Elysia Gift Set", sourceName: "סט Y006", finish: "כסף", sourceUrl: "https://silverisrael.co.il/product/y006-%d7%a1%d7%98/", role: "Catalog" },
] as const satisfies readonly SilverIsraelCatalogRow[];

const categoryByHebrew = {
  טבעת: "rings",
  שרשרת: "necklaces",
  עגילים: "earrings",
  צמיד: "bracelets",
  סט: "sets",
} satisfies Record<SilverIsraelCategory, SeedCategorySlug>;

const categoryKind = {
  bracelets: "צמיד",
  earrings: "עגילי",
  necklaces: "שרשרת",
  rings: "טבעת",
  sets: "סט",
} satisfies Record<SeedCategorySlug, string>;

const categorySkuPrefix = {
  bracelets: "BR",
  earrings: "ER",
  necklaces: "NK",
  rings: "RG",
  sets: "ST",
} satisfies Record<SeedCategorySlug, string>;

const categoryPriceBase = {
  bracelets: 360,
  earrings: 240,
  necklaces: 390,
  rings: 420,
  sets: 620,
} satisfies Record<SeedCategorySlug, number>;

const finishMaterialSlug = {
  "כסף": "sterling-silver",
  "זהב": "gold-plated-sterling-silver",
  "רוז גולד": "rose-gold-plated-sterling-silver",
} satisfies Record<SilverIsraelFinish, SeedMaterialSlug>;

const finishPublicName = {
  "כסף": "Silver",
  "זהב": "Gold",
  "רוז גולד": "Rose Gold",
} satisfies Record<SilverIsraelFinish, string>;

const finishVariantColor = {
  "כסף": "כסף",
  "זהב": "ציפוי זהב",
  "רוז גולד": "רוז גולד",
} satisfies Record<SilverIsraelFinish, string>;

const finishPricePremium = {
  "כסף": 0,
  "זהב": 90,
  "רוז גולד": 110,
} satisfies Record<SilverIsraelFinish, number>;

const rolePricePremium = {
  Catalog: 0,
  Featured: 90,
  "Hero / Best Seller": 160,
} satisfies Record<SilverIsraelRole, number>;

const collectionSlugByName = Object.fromEntries(
  seedCollections.map((collection) => [collection.name, collection.slug]),
);

const rowCountsByName = countBy(silverIsraelCatalogRows, (row) => row.name);
const rowCountsByNameAndFinish = countBy(
  silverIsraelCatalogRows,
  (row) => `${row.name}:${row.finish}`,
);

export function getSeedProducts(): SeedProduct[] {
  const usedNamesByNameAndFinish = new Map<string, number>();

  return silverIsraelCatalogRows.map((row) => {
    const categorySlug = categoryByHebrew[row.category];
    const materialSlug = finishMaterialSlug[row.finish];
    const stoneSlug = inferStoneSlug(row);
    const displayName = createDisplayName(row, usedNamesByNameAndFinish);
    const serial = row.index.toString().padStart(3, "0");
    const sku = `SI-${categorySkuPrefix[categorySlug]}-${serial}`;
    const slug = `${slugifyLatin(displayName)}-${serial}`;
    const images = getSeedProductCatalogImages(categorySlug, slug);
    const basePrice = getSeedProductBasePrice(row, categorySlug);
    const collectionSlug = getCollectionSlug(row.collection);
    const tags = createTags({
      categorySlug,
      collectionSlug,
      row,
      stoneSlug,
    });
    const sourceCode = getSourceCode(row);

    return {
      slug,
      sku,
      name: displayName,
      shortDescription: createShortDescription({
        categorySlug,
        materialSlug,
        row,
        stoneSlug,
      }),
      description: createDescription({
        categorySlug,
        collectionSlug,
        materialSlug,
        row,
        stoneSlug,
      }),
      categorySlug,
      materialSlug,
      stoneSlug,
      basePrice: String(basePrice),
      collectionSlugs: [collectionSlug],
      image: images[0] ?? "/brand/boutique/product-detail.avif",
      images,
      media: images.map((url, index) => ({
        alt: createMediaAlt(displayName, index),
        role: PRODUCT_MEDIA_ROLES[index] ?? "CONTEXT",
        sortOrder: index,
        url,
      })),
      tags,
      sourceCode,
      sourceHandle: getSourceHandle(row, sourceCode),
      sourceUrl: row.sourceUrl,
      supplierKey: SUPPLIER_KEY,
      variants: createVariants({
        basePrice,
        categorySlug,
        finish: row.finish,
        sku,
        stoneSlug,
        rowIndex: row.index,
      }),
    };
  });
}

function createDisplayName(
  row: SilverIsraelCatalogRow,
  usedNamesByNameAndFinish: Map<string, number>,
) {
  if ((rowCountsByName.get(row.name) ?? 0) <= 1) {
    return row.name;
  }

  const finishName = finishPublicName[row.finish];
  const nameAndFinishKey = `${row.name}:${row.finish}`;
  const nextUse = (usedNamesByNameAndFinish.get(nameAndFinishKey) ?? 0) + 1;

  usedNamesByNameAndFinish.set(nameAndFinishKey, nextUse);

  if ((rowCountsByNameAndFinish.get(nameAndFinishKey) ?? 0) <= 1) {
    return `${row.name} ${finishName}`;
  }

  return `${row.name} ${finishName} ${toRoman(nextUse)}`;
}

function getSeedProductBasePrice(
  row: SilverIsraelCatalogRow,
  categorySlug: SeedCategorySlug,
) {
  return (
    categoryPriceBase[categorySlug] +
    finishPricePremium[row.finish] +
    rolePricePremium[row.role] +
    (row.index % 7) * 25
  );
}

function createShortDescription(input: {
  categorySlug: SeedCategorySlug;
  materialSlug: SeedMaterialSlug;
  row: SilverIsraelCatalogRow;
  stoneSlug: SeedStoneSlug | null;
}) {
  const stoneText = input.stoneSlug
    ? ` עם ${getStoneName(input.stoneSlug)}`
    : "";

  return `${categoryKind[input.categorySlug]} ${getMaterialName(input.materialSlug)}${stoneText} מתוך עריכת Silver Israel ל-Elysia.`;
}

function createDescription(input: {
  categorySlug: SeedCategorySlug;
  collectionSlug: SeedCollectionSlug;
  materialSlug: SeedMaterialSlug;
  row: SilverIsraelCatalogRow;
  stoneSlug: SeedStoneSlug | null;
}) {
  const collectionName = getCollectionName(input.collectionSlug);
  const stoneText = input.stoneSlug
    ? ` ושילוב ${getStoneName(input.stoneSlug)}`
    : "";

  return `${input.row.name} נבחר לקולקציית ${collectionName} בזכות קו נקי, חומר ${getMaterialName(input.materialSlug)}${stoneText} והתאמה לענידה יומיומית או למתנה. המחיר והמלאי באתר הם נתוני seed עד לאימות ספק מלא.`;
}

function createTags(input: {
  categorySlug: SeedCategorySlug;
  collectionSlug: SeedCollectionSlug;
  row: SilverIsraelCatalogRow;
  stoneSlug: SeedStoneSlug | null;
}) {
  const roleTag =
    input.row.role === "Hero / Best Seller"
      ? "Best Seller"
      : input.row.role;

  return Array.from(
    new Set([
      getCategoryName(input.categorySlug),
      getCollectionName(input.collectionSlug),
      finishVariantColor[input.row.finish],
      roleTag,
      "Silver Israel",
      "מתנה",
      input.stoneSlug ? getStoneName(input.stoneSlug) : "ללא אבן",
    ]),
  );
}

function createVariants(input: {
  basePrice: number;
  categorySlug: SeedCategorySlug;
  finish: SilverIsraelFinish;
  rowIndex: number;
  sku: string;
  stoneSlug: SeedStoneSlug | null;
}): SeedProductVariant[] {
  const sizes = getVariantSizes(input.categorySlug, input.rowIndex);

  return sizes.map((size, index) => ({
    sku: `${input.sku}-V${index + 1}`,
    name: getVariantName(input.categorySlug, size),
    size,
    metalColor: finishVariantColor[input.finish],
    stoneColor: input.stoneSlug ? getStoneColor(input.stoneSlug) : null,
    priceDelta: String(index * getVariantPriceStep(input.categorySlug)),
    quantityTlv: 2 + ((input.rowIndex + index) % 6),
    quantityJerusalem: 1 + ((input.rowIndex + index * 2) % 5),
    safetyStock: 1,
  }));
}

function getVariantSizes(categorySlug: SeedCategorySlug, rowIndex: number) {
  if (categorySlug === "rings") {
    const ringGroups = [
      ["50", "52", "54"],
      ["52", "54", "56"],
      ["54", "56", "58"],
      ["48", "50", "52"],
    ] as const;

    return ringGroups[rowIndex % ringGroups.length] ?? ringGroups[0];
  }

  if (categorySlug === "necklaces") {
    const necklaceGroups = [
      ["42", "45"],
      ["45", "50"],
      ["40", "45"],
    ] as const;

    return necklaceGroups[rowIndex % necklaceGroups.length] ?? necklaceGroups[0];
  }

  if (categorySlug === "bracelets") {
    const braceletGroups = [
      ["16", "18"],
      ["18", "20"],
      ["S", "M"],
    ] as const;

    return braceletGroups[rowIndex % braceletGroups.length] ?? braceletGroups[0];
  }

  if (categorySlug === "sets") {
    return ["סט מלא"] as const;
  }

  return ["זוג"] as const;
}

function getVariantName(categorySlug: SeedCategorySlug, size: string) {
  if (categorySlug === "rings") return `מידה ${size}`;
  if (categorySlug === "necklaces") return `${size} ס״מ`;
  if (categorySlug === "earrings") return "זוג עגילים";
  if (categorySlug === "sets") return "סט מלא";

  return size;
}

function getVariantPriceStep(categorySlug: SeedCategorySlug) {
  if (categorySlug === "rings") return 45;
  if (categorySlug === "necklaces") return 35;
  if (categorySlug === "bracelets") return 40;

  return 0;
}

function inferStoneSlug(row: SilverIsraelCatalogRow): SeedStoneSlug | null {
  const text = `${row.collection} ${row.name} ${row.sourceName}`.toLowerCase();

  if (/pearl|pearls|פנינ|פנינה/u.test(text)) return "pearl";
  if (/tennis|טניס|לב|טיפה|halo|sparkle|bridal/u.test(text)) return "zircon";

  return null;
}

function getSeedProductCatalogImages(
  categorySlug: SeedCategorySlug,
  slug: string,
) {
  const supplierImages = seedSilverIsraelProductImages[slug];

  if (supplierImages?.length) {
    return [...supplierImages];
  }

  if (categorySlug === "sets") {
    return getSetCatalogImages(slug);
  }

  const primaryImageIndex = getStableIndex(slug, PRODUCT_CATALOG_IMAGE_COUNT);

  return Array.from({ length: PRODUCT_MEDIA_ROLES.length }, (_, offset) =>
    getProductCatalogImageByIndex({
      categorySlug,
      imageIndex: getProductCatalogOrderedImageIndex(
        (primaryImageIndex + offset) % PRODUCT_CATALOG_IMAGE_COUNT,
      ),
    }),
  );
}

function getSetCatalogImages(slug: string) {
  const primaryImageIndex = getStableIndex(slug, PRODUCT_CATALOG_IMAGE_COUNT);
  const startCategoryIndex = getStableIndex(slug, SET_IMAGE_CATEGORIES.length);

  return Array.from({ length: PRODUCT_MEDIA_ROLES.length }, (_, offset) => {
    const categorySlug =
      SET_IMAGE_CATEGORIES[
        (startCategoryIndex + offset) % SET_IMAGE_CATEGORIES.length
      ] ?? "necklaces";

    return getProductCatalogImageByIndex({
      categorySlug,
      imageIndex: getProductCatalogOrderedImageIndex(
        (primaryImageIndex + offset) % PRODUCT_CATALOG_IMAGE_COUNT,
      ),
    });
  });
}

function getProductCatalogOrderedImageIndex(imageIndex: number) {
  return PRODUCT_CATALOG_IMAGE_ORDER[imageIndex] ?? imageIndex;
}

function getProductCatalogImageByIndex(input: {
  categorySlug: Exclude<SeedCategorySlug, "sets">;
  imageIndex: number;
}) {
  const imageNumber = input.imageIndex + 1;
  const paddedImageNumber = imageNumber.toString().padStart(2, "0");

  return `/brand/product-catalog/${input.categorySlug}-${paddedImageNumber}.avif`;
}

function createMediaAlt(productName: string, index: number) {
  const labels = [
    "תמונה ראשית",
    "זווית נוספת",
    "קנה מידה",
    "פרט מבנה",
    "פרט חומר",
    "הקשר ענידה",
  ] as const;

  return `${productName} - ${labels[index] ?? "תמונה נוספת"}`;
}

function getSourceCode(row: SilverIsraelCatalogRow) {
  const code = /(?:[a-z]+si|si|y)\d+(?:-\d+)?/iu.exec(row.sourceName)?.[0];

  if (code) return code.toUpperCase();

  return `SI-${row.index.toString().padStart(3, "0")}`;
}

function getSourceHandle(row: SilverIsraelCatalogRow, sourceCode: string) {
  const productPath = /\/product\/([^/]+)\//u.exec(row.sourceUrl)?.[1];

  if (productPath) return productPath.toLowerCase();

  return slugifyLatin(`${row.name} ${sourceCode}`);
}

function getCollectionSlug(collectionName: string): SeedCollectionSlug {
  const collectionSlug = collectionSlugByName[collectionName];

  if (!collectionSlug) {
    throw new Error(`Missing seed collection for "${collectionName}".`);
  }

  return collectionSlug;
}

function getCategoryName(categorySlug: SeedCategorySlug) {
  return (
    seedCategories.find((category) => category.slug === categorySlug)?.name ??
    categorySlug
  );
}

function getCollectionName(collectionSlug: SeedCollectionSlug) {
  return (
    seedCollections.find((collection) => collection.slug === collectionSlug)
      ?.name ?? collectionSlug
  );
}

function getMaterialName(materialSlug: SeedMaterialSlug) {
  return (
    seedMaterials.find((material) => material.slug === materialSlug)?.name ??
    materialSlug
  );
}

function getStoneName(stoneSlug: SeedStoneSlug) {
  return seedStones.find((stone) => stone.slug === stoneSlug)?.name ?? stoneSlug;
}

function getStoneColor(stoneSlug: SeedStoneSlug) {
  if (stoneSlug === "pearl") return "פנינה";

  return "לבן";
}

function slugifyLatin(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toRoman(value: number) {
  const numerals = ["I", "II", "III", "IV", "V"] as const;

  return numerals[value - 1] ?? String(value);
}

function countBy<T>(values: readonly T[], getKey: (value: T) => string) {
  const counts = new Map<string, number>();

  for (const value of values) {
    const key = getKey(value);

    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return counts;
}

function getStableIndex(value: string, length: number) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return length > 0 ? hash % length : 0;
}
