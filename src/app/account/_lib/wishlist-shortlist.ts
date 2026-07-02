export type WishlistShortlistItem = {
  categoryName?: string | null;
  categorySlug?: string | null;
  materialName?: string | null;
  productName: string;
  productSlug: string;
  stoneName?: string | null;
  variantName?: string | null;
};

export type WishlistDecisionCue = {
  id: "category" | "material" | "variant";
  label: string;
  value: string;
};

export type WishlistDecisionSupport = {
  categoryHref: string;
  cues: WishlistDecisionCue[];
  serviceHref: string;
  summary: string;
};

/**
 * Structural shape of a persisted wishlist item (with its variant/product
 * relations) as loaded on the account and wishlist pages. Declared here so
 * both pages can derive decision support without repeating the field mapping.
 */
export type WishlistItemWithProduct = {
  variant: {
    name?: string | null;
    product: {
      name: string;
      slug: string;
      category: { name?: string | null; slug?: string | null };
      material: { name?: string | null };
      stone?: { name?: string | null } | null;
    };
  };
};

/** Map persisted wishlist items into shortlist facets and derive decision support. */
export function getWishlistDecisionSupportFromItems(
  items: readonly WishlistItemWithProduct[],
): WishlistDecisionSupport | null {
  return getWishlistDecisionSupport(
    items.map((item) => ({
      categoryName: item.variant.product.category.name,
      categorySlug: item.variant.product.category.slug,
      materialName: item.variant.product.material.name,
      productName: item.variant.product.name,
      productSlug: item.variant.product.slug,
      stoneName: item.variant.product.stone?.name,
      variantName: item.variant.name,
    })),
  );
}

export function getWishlistDecisionSupport(
  items: WishlistShortlistItem[],
): WishlistDecisionSupport | null {
  if (items.length === 0) return null;

  const topCategory = getTopFacet(
    items
      .map((item) => ({
        label: item.categoryName,
        slug: item.categorySlug,
      }))
      .filter(hasFacetLabel),
  );
  const topMaterial = getTopFacet(
    items
      .map((item) => ({
        label: item.materialName,
      }))
      .filter(hasFacetLabel),
  );
  const topStone = getTopFacet(
    items
      .map((item) => ({
        label: item.stoneName,
      }))
      .filter(hasFacetLabel),
  );
  const firstVariant = items.find((item) => item.variantName?.trim());
  const categoryCount = new Set(
    items.map((item) => item.categoryName).filter(Boolean),
  ).size;

  const categoryHref = topCategory?.slug
    ? `/category/${topCategory.slug}`
    : "/search";

  return {
    categoryHref,
    cues: [
      {
        id: "category",
        label: "כיוון מרכזי",
        value:
          categoryCount > 1
            ? `${categoryCount} קטגוריות להשוואה`
            : (topCategory?.label ?? "תכשיטים מתוך המבחר"),
      },
      {
        id: "material",
        label: "קו חומרי",
        value:
          topMaterial?.label ??
          topStone?.label ??
          "פרטי חומר ואבן בכל עמוד מוצר",
      },
      {
        id: "variant",
        label: "בדיקה לפני החלטה",
        value: firstVariant?.variantName ?? "מידה, התאמה וזמינות",
      },
    ],
    serviceHref: createWishlistServiceHref(items),
    summary: `נשמרו ${items.length} ${items.length === 1 ? "תכשיט" : "תכשיטים"} להשוואה לפני החלטה.`,
  };
}

function createWishlistServiceHref(items: WishlistShortlistItem[]) {
  const productReference = items
    .slice(0, 3)
    .map((item) => item.productName)
    .filter(Boolean)
    .join(", ");
  const params = new URLSearchParams({
    message: "אבקש עזרה בהתאמת מידה או בהשוואה בין הפריטים ששמרתי.",
    topic: "sizing",
  });

  if (productReference) {
    params.set("productReference", productReference);
  }

  return `/service?${params.toString()}`;
}

function getTopFacet<T extends { label: string; slug?: string | null }>(
  facets: T[],
) {
  const counts = new Map<string, { count: number; facet: T }>();

  for (const facet of facets) {
    const current = counts.get(facet.label);
    counts.set(facet.label, {
      count: (current?.count ?? 0) + 1,
      facet: current?.facet ?? facet,
    });
  }

  return [...counts.values()].sort((a, b) => b.count - a.count)[0]?.facet;
}

function hasFacetLabel<T extends { label?: string | null }>(
  facet: T,
): facet is T & { label: string } {
  return Boolean(facet.label?.trim());
}
