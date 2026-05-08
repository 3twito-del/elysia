export type BrandMediaCategorySlug =
  | "rings"
  | "necklaces"
  | "earrings"
  | "bracelets";

export type BrandMediaAsset = {
  url: string;
  alt: string;
};

const image = (id: string, width = 1800, quality = 86) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=${quality}`;

const productStillLife = image("photo-1515562141207-7a88fb7ce338");
const ringCloseup = image("photo-1605100804763-247f67b3557e");
const diamondEditorial = image("photo-1506630448388-4e683c67ddb0");
const pearlJewelryTray = image("photo-1611652022419-a9419f74343d");
const necklaceCloseup = image("photo-1599643478518-a784e5dc4c8f");
const pearlStillLife = image("photo-1523293182086-7651a899d37f");
const earringCloseup = image("photo-1535632066927-ab7c9ab60908");
const braceletCloseup = image("photo-1611591437281-460bfbe1220a");

const editorialAsset = (url: string, alt: string): BrandMediaAsset => ({
  url,
  alt,
});

export const brandMedia = {
  homeHero: editorialAsset(
    image("photo-1515562141207-7a88fb7ce338", 2400, 88),
    "Aphrodite jewelry editorial still life",
  ),
  homeSecondary: editorialAsset(
    image("photo-1611652022419-a9419f74343d", 2000, 86),
    "Layered jewelry on a neutral studio surface",
  ),
  aiHero: editorialAsset(
    image("photo-1523293182086-7651a899d37f", 2000, 86),
    "Curated jewelry gift selection",
  ),
  stylistHero: editorialAsset(
    image("photo-1506630448388-4e683c67ddb0", 2000, 86),
    "Fine jewelry styling close up",
  ),
  branchesHero: editorialAsset(
    image("photo-1611652022419-a9419f74343d", 2000, 86),
    "Aphrodite boutique appointment setting",
  ),
  collectionHeroes: {
    "studio-light": editorialAsset(
      productStillLife,
      "Minimal jewelry on a light studio surface",
    ),
    "bridal-edit": editorialAsset(
      ringCloseup,
      "Diamond ring bridal editorial close up",
    ),
    "daily-icons": editorialAsset(
      diamondEditorial,
      "Everyday fine jewelry editorial detail",
    ),
    "evening-glow": editorialAsset(
      pearlStillLife,
      "Evening jewelry still life with pearl tones",
    ),
    "gift-studio": editorialAsset(
      pearlJewelryTray,
      "Gift jewelry arrangement in neutral studio light",
    ),
  },
  categoryHeroes: {
    rings: editorialAsset(ringCloseup, "Fine ring editorial close up"),
    necklaces: editorialAsset(
      necklaceCloseup,
      "Fine necklace editorial close up",
    ),
    earrings: editorialAsset(
      earringCloseup,
      "Fine earrings editorial close up",
    ),
    bracelets: editorialAsset(
      braceletCloseup,
      "Fine bracelet editorial close up",
    ),
  },
  productPools: {
    rings: [
      editorialAsset(ringCloseup, "Fine ring product close up"),
      editorialAsset(diamondEditorial, "Diamond ring editorial still life"),
      editorialAsset(productStillLife, "Ring on a bright studio surface"),
      editorialAsset(pearlJewelryTray, "Ring in neutral studio light"),
    ],
    necklaces: [
      editorialAsset(necklaceCloseup, "Fine necklace product close up"),
      editorialAsset(
        productStillLife,
        "Necklace still life on a light surface",
      ),
      editorialAsset(pearlStillLife, "Necklace layered with pearl tones"),
      editorialAsset(diamondEditorial, "Necklace editorial detail"),
    ],
    earrings: [
      editorialAsset(earringCloseup, "Fine earrings product close up"),
      editorialAsset(pearlJewelryTray, "Earrings in neutral studio light"),
      editorialAsset(
        productStillLife,
        "Earrings still life on a bright surface",
      ),
      editorialAsset(diamondEditorial, "Earrings editorial detail"),
    ],
    bracelets: [
      editorialAsset(braceletCloseup, "Fine bracelet product close up"),
      editorialAsset(pearlStillLife, "Bracelet layered still life"),
      editorialAsset(productStillLife, "Bracelet on a light studio surface"),
      editorialAsset(necklaceCloseup, "Bracelet editorial detail"),
    ],
  },
  manualProducts: {
    "venus-line-ring": [
      editorialAsset(ringCloseup, "Venus Line ring close up"),
      editorialAsset(diamondEditorial, "Venus Line ring editorial detail"),
      editorialAsset(productStillLife, "Venus Line ring still life"),
    ],
    "muse-pearl-earrings": [
      editorialAsset(earringCloseup, "Muse Pearl earrings close up"),
      editorialAsset(pearlJewelryTray, "Muse Pearl earrings editorial detail"),
      editorialAsset(productStillLife, "Muse Pearl earrings still life"),
    ],
    "selene-chain": [
      editorialAsset(necklaceCloseup, "Selene chain close up"),
      editorialAsset(pearlStillLife, "Selene chain layered still life"),
      editorialAsset(diamondEditorial, "Selene chain editorial detail"),
    ],
    "hera-bracelet": [
      editorialAsset(braceletCloseup, "Hera bracelet close up"),
      editorialAsset(pearlStillLife, "Hera bracelet layered still life"),
      editorialAsset(productStillLife, "Hera bracelet still life"),
    ],
  },
} as const;

export const DEFAULT_BRAND_MEDIA = brandMedia.homeHero.url;

const seedImageIds = [
  "photo-1515562141207-7a88fb7ce338",
  "photo-1605100804763-247f67b3557e",
  "photo-1506630448388-4e683c67ddb0",
  "photo-1611652022419-a9419f74343d",
  "photo-1599643478518-a784e5dc4c8f",
  "photo-1523293182086-7651a899d37f",
  "photo-1535632066927-ab7c9ab60908",
  "photo-1611591437281-460bfbe1220a",
] as const;

export function getBrandCategoryHero(slug: string) {
  return (
    brandMedia.categoryHeroes[slug as BrandMediaCategorySlug] ??
    brandMedia.homeHero
  );
}

export function getBrandProductMediaUrls(input: {
  categorySlug: string;
  slug: string;
  currentImages?: readonly string[];
}) {
  const manualMedia =
    brandMedia.manualProducts[
      input.slug as keyof typeof brandMedia.manualProducts
    ];

  if (manualMedia) {
    return manualMedia.map((asset) => asset.url);
  }

  const currentImages = (input.currentImages ?? []).filter(Boolean);

  if (shouldRespectExistingMedia(input.slug, currentImages)) {
    return [...currentImages];
  }

  return getSeedProductMediaUrls(input.categorySlug, input.slug);
}

export function getSeedProductMediaUrls(categorySlug: string, slug: string) {
  return selectBrandMediaSet(categorySlug, slug, 3).map((asset) => asset.url);
}

function selectBrandMediaSet(
  categorySlug: string,
  slug: string,
  count: number,
) {
  const pool =
    brandMedia.productPools[categorySlug as BrandMediaCategorySlug] ??
    brandMedia.productPools.rings;
  const offset = getProductMediaOffset(slug, pool.length);

  return Array.from({ length: Math.min(count, pool.length) }, (_, index) => {
    const asset = pool[(offset + index) % pool.length];

    if (!asset) {
      throw new Error("Brand media pool is unexpectedly empty.");
    }

    return asset;
  });
}

function shouldRespectExistingMedia(slug: string, urls: readonly string[]) {
  if (urls.length === 0) return false;
  if (slug.startsWith("test-")) return false;
  if (urls.length > 1) {
    return urls.some((url) => !isSeedCatalogImage(url));
  }

  const [onlyUrl] = urls;

  return onlyUrl ? !isSeedCatalogImage(onlyUrl) : false;
}

function isSeedCatalogImage(url: string) {
  return seedImageIds.some((id) => url.includes(id));
}

function getProductMediaOffset(slug: string, length: number) {
  const serial = /-(\d+)$/.exec(slug)?.[1];

  if (serial) {
    return Number(serial) % length;
  }

  return getStableIndex(slug, length);
}

function getStableIndex(value: string, length: number) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash % length;
}
