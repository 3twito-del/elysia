export type SizeGuideReturnContext = {
  description: string;
  href: string;
  label: string;
  surface: "category" | "product";
};

const returnOrigin = "https://elysia.local";
const maxReturnHrefLength = 180;
const productPathPattern = /^\/product\/[a-z0-9-]+$/i;
const categoryPathPattern = /^\/category\/[a-z0-9-]+$/i;

export function getSafeSizeGuideReturnContext(
  value: string | undefined,
  productName?: string,
): SizeGuideReturnContext | undefined {
  if (!value || value.length > maxReturnHrefLength) return undefined;
  if (value.startsWith("//") || value.includes("://") || value.includes("\\")) {
    return undefined;
  }

  let url: URL;

  try {
    url = new URL(value, returnOrigin);
  } catch {
    return undefined;
  }

  if (url.origin !== returnOrigin || url.hash) return undefined;

  const href = `${url.pathname}${url.search}`;

  if (productPathPattern.test(url.pathname)) {
    return {
      description: productName
        ? `הגעתם ממוצר: ${productName}. אפשר לשמור מידה ולחזור לעמוד המוצר.`
        : "הגעתם מעמוד מוצר. אפשר לשמור מידה ולחזור לעמוד המוצר.",
      href,
      label: "חזרה למוצר",
      surface: "product",
    };
  }

  if (categoryPathPattern.test(url.pathname)) {
    return {
      description:
        "הגעתם מקטגוריה. אפשר לשמור מידה ולחזור לבחירה בלי לאבד את ההקשר.",
      href,
      label: "חזרה לקטגוריה",
      surface: "category",
    };
  }

  return undefined;
}
