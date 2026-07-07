/**
 * Build the schema.org `Product` JSON-LD for a product page.
 *
 * `JSON.stringify` already drops `undefined` properties, but it happily emits
 * empty strings and placeholder text. Search engines then index a value the
 * page never shows. This builder omits any field that is empty or still a
 * placeholder, and only emits an `Offer` when the price is a real positive
 * amount, so structured data can never expose a value hidden or contradicted by
 * the page (F-10).
 */
export type ProductStructuredDataInput = {
  brandName: string;
  category?: string | null;
  description?: string | null;
  image?: string | null;
  inStock: boolean;
  material?: string | null;
  name: string;
  price?: number | null;
  priceCurrency: string;
  sku?: string | null;
};

export function buildProductStructuredData(input: ProductStructuredDataInput) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name.trim(),
    brand: { "@type": "Brand", name: input.brandName },
  };

  assignIfPresent(data, "sku", input.sku);
  assignIfPresent(data, "image", input.image);
  assignIfPresent(data, "description", input.description);
  assignIfPresent(data, "category", input.category);
  assignIfPresent(data, "material", input.material);

  if (
    typeof input.price === "number" &&
    Number.isFinite(input.price) &&
    input.price > 0
  ) {
    data.offers = {
      "@type": "Offer",
      priceCurrency: input.priceCurrency,
      price: input.price,
      availability: input.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/PreOrder",
    };
  }

  return data;
}

function assignIfPresent(
  target: Record<string, unknown>,
  key: string,
  value: string | null | undefined,
) {
  const cleaned = cleanStructuredValue(value);

  if (cleaned) target[key] = cleaned;
}

function cleanStructuredValue(value: string | null | undefined): string | null {
  const trimmed = value?.trim();

  if (!trimmed || isPlaceholderStructuredValue(trimmed)) return null;

  return trimmed;
}

function isPlaceholderStructuredValue(value: string) {
  return /\[\s*(?:להשלמה|שם משפטי להשלמה)|legalPlaceholder|placeholder|todo|tbd/iu.test(
    value,
  );
}
