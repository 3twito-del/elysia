const publicCategoryNameBySlug: Record<string, string> = {
  bracelets: "צמידים",
  earrings: "עגילים",
  necklaces: "שרשראות",
  rings: "טבעות",
  sets: "סטים",
};

export function getPublicProductName(name: string) {
  const cleaned = name
    .replace(/\bElysia\s+Supplier\b/giu, "Elysia")
    .replace(/\bSupplier\b|\bShopify\b|\bDropship(?:ping)?\b/giu, "")
    .replace(/\s+מהספק$/u, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return cleaned && !hasPrivateCatalogLabel(cleaned) ? cleaned : "תכשיט Elysia";
}

export function getPublicCollectionName(collection?: string | null) {
  if (!collection) return undefined;

  if (hasPrivateCatalogLabel(collection)) {
    return "Signature edit";
  }

  return collection;
}

export function getPublicCategoryName(slug: string, name: string) {
  return publicCategoryNameBySlug[slug] ?? name;
}

export function getPublicMaterialName(
  material: string,
  productName?: string | null,
) {
  const cleaned = material.trim();

  if (!cleaned || hasPrivateCatalogLabel(cleaned)) {
    return inferMaterialFromProductName(productName);
  }

  return cleaned;
}

export function getPublicStoneName(stone?: string | null) {
  if (!stone) return undefined;

  const cleaned = stone.trim();

  if (!cleaned || hasPrivateCatalogLabel(cleaned)) return undefined;

  return cleaned;
}

export function getPublicVariantOptionName(value?: string | null) {
  if (!value) return "אפשרות";

  const cleaned = value.trim();

  if (!cleaned || hasPrivateCatalogLabel(cleaned)) return "אפשרות";
  if (/^silver$/iu.test(cleaned)) return "כסף";
  if (/^gold$/iu.test(cleaned)) return "זהב";
  if (/^rose\s+gold$/iu.test(cleaned)) return "רוז גולד";
  if (/^white\s+gold$/iu.test(cleaned)) return "זהב לבן";
  if (/^yellow\s+gold$/iu.test(cleaned)) return "זהב צהוב";

  return cleaned;
}

function inferMaterialFromProductName(productName?: string | null) {
  if (!productName) return undefined;

  if (/silver|כסף/iu.test(productName)) return "כסף 925";
  if (/gold|זהב/iu.test(productName)) return "ציפוי זהב";

  return undefined;
}

function hasPrivateCatalogLabel(value: string) {
  return /supplier|shopify|dropship|\bqa\b/iu.test(value);
}
