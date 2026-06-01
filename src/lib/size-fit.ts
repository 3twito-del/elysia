import { z } from "zod";

export const sizeFitKinds = [
  "ring",
  "bracelet",
  "necklace",
  "earring",
] as const;

export type SizeFitKind = (typeof sizeFitKinds)[number];

export type SavedSize = {
  kind: SizeFitKind;
  value: string;
};

export type SizeFitVariant = {
  sku: string;
  name?: string;
  size?: string;
  availableQuantity?: number;
};

export type SizeFitMatch<TVariant extends SizeFitVariant = SizeFitVariant> = {
  available: boolean;
  exact: boolean;
  kind: SizeFitKind;
  normalizedValue: string;
  variant: TVariant;
};

const ringSizeRange = { min: 40, max: 76 };
const centimeterRange = {
  bracelet: { min: 12, max: 24 },
  necklace: { min: 35, max: 70 },
};
const braceletAlphaSizes = ["XS", "S", "M", "L"] as const;
const earringAliases = new Map<string, string>([
  ["mini", "mini"],
  ["מיני", "mini"],
  ["stud", "stud"],
  ["סטוד", "stud"],
  ["classic", "classic"],
  ["קלאסי", "classic"],
  ["drop", "drop"],
  ["תלוי", "drop"],
  ["small", "small"],
  ["קטן", "small"],
  ["medium", "medium"],
  ["בינוני", "medium"],
  ["round", "round"],
  ["עגול", "round"],
  ["long", "long"],
  ["ארוך", "long"],
]);

export const savedSizeInputSchema = z
  .object({
    kind: z.enum(sizeFitKinds),
    value: z.string().trim().min(1).max(40),
  })
  .transform((input, context) => {
    const normalizedValue = normalizeSavedSize(input.kind, input.value);

    if (!normalizedValue) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "המידה שנבחרה אינה נתמכת.",
        path: ["value"],
      });

      return z.NEVER;
    }

    return {
      kind: input.kind,
      value: normalizedValue,
    } satisfies SavedSize;
  });

export function normalizeSavedSize(kind: SizeFitKind, rawValue: string) {
  const value = rawValue.trim();

  if (kind === "ring") {
    return normalizeNumericSize(value, ringSizeRange);
  }

  if (kind === "bracelet") {
    const alphaSize = value.toUpperCase();

    if ((braceletAlphaSizes as readonly string[]).includes(alphaSize)) {
      return alphaSize;
    }

    return normalizeNumericSize(value, centimeterRange.bracelet);
  }

  if (kind === "necklace") {
    return normalizeNumericSize(value, centimeterRange.necklace);
  }

  return normalizeEarringSize(value);
}

export function getSizeKindForCategory(
  categorySlug: string,
): SizeFitKind | null {
  if (categorySlug === "rings") return "ring";
  if (categorySlug === "bracelets") return "bracelet";
  if (categorySlug === "necklaces") return "necklace";
  if (categorySlug === "earrings") return "earring";

  return null;
}

export function formatSavedSize(kind: SizeFitKind, value: string) {
  if (kind === "ring") return `מידת טבעת ${value}`;
  if (kind === "bracelet") return `צמיד ${value}`;
  if (kind === "necklace") return `${value} ס״מ`;

  return getEarringLabel(value);
}

export function getSizeKindLabel(kind: SizeFitKind) {
  if (kind === "ring") return "טבעות";
  if (kind === "bracelet") return "צמידים";
  if (kind === "necklace") return "שרשראות";

  return "עגילים";
}

export function getSizeGuideHref(
  kind?: SizeFitKind,
  options?: { productName?: string; returnTo?: string },
) {
  const params = new URLSearchParams();

  if (kind) params.set("kind", kind);
  if (options?.returnTo) params.set("returnTo", options.returnTo);
  if (options?.productName) params.set("product", options.productName);

  const query = params.toString();

  return query ? `/size-guide?${query}` : "/size-guide";
}

export function findBestVariantForSavedSize<TVariant extends SizeFitVariant>(
  variants: readonly TVariant[],
  kind: SizeFitKind,
  rawValue: string | undefined,
): SizeFitMatch<TVariant> | null {
  if (!rawValue || variants.length === 0) return null;

  const normalizedValue = normalizeSavedSize(kind, rawValue);

  if (!normalizedValue) return null;

  const candidates = variants
    .map((variant) => createVariantCandidate(variant, kind, normalizedValue))
    .filter((candidate): candidate is NonNullable<typeof candidate> =>
      Boolean(candidate),
    )
    .sort(
      (first, second) =>
        Number(second.exact) - Number(first.exact) ||
        first.distance - second.distance ||
        Number(second.variant.availableQuantity ?? 0) -
          Number(first.variant.availableQuantity ?? 0),
    );

  const selected = candidates[0];

  if (!selected) return null;

  return {
    available: (selected.variant.availableQuantity ?? 0) > 0,
    exact: selected.exact,
    kind,
    normalizedValue,
    variant: selected.variant,
  };
}

function createVariantCandidate<TVariant extends SizeFitVariant>(
  variant: TVariant,
  kind: SizeFitKind,
  normalizedValue: string,
) {
  const source = variant.size ?? variant.name ?? "";

  if (!source) return null;

  const normalized = normalizeSavedSize(kind, source);

  if (!normalized) return null;

  if (normalized === normalizedValue) {
    return { distance: 0, exact: true, variant };
  }

  if (kind === "ring" || kind === "necklace") {
    const wanted = Number(normalizedValue);
    const actual = Number(normalized);

    if (Number.isFinite(wanted) && Number.isFinite(actual)) {
      return { distance: Math.abs(wanted - actual), exact: false, variant };
    }
  }

  if (kind === "bracelet" && isNumericValue(normalizedValue)) {
    const actual = Number(normalized);

    if (Number.isFinite(actual)) {
      return {
        distance: Math.abs(Number(normalizedValue) - actual),
        exact: false,
        variant,
      };
    }
  }

  return null;
}

function normalizeNumericSize(
  value: string,
  range: { max: number; min: number },
) {
  const match = /\d+(?:\.\d+)?/u.exec(value.replace(",", "."));

  if (!match) return null;

  const numeric = Math.round(Number(match[0]));

  if (!Number.isFinite(numeric) || numeric < range.min || numeric > range.max) {
    return null;
  }

  return String(numeric);
}

function normalizeEarringSize(value: string) {
  const normalized = value.trim().toLowerCase();

  return earringAliases.get(normalized) ?? null;
}

export function getEarringLabel(value: string) {
  const labels: Record<string, string> = {
    classic: "עגילים קלאסיים",
    drop: "עגילים תלויים",
    long: "עגילים ארוכים",
    medium: "עגילים בינוניים",
    mini: "עגילי מיני",
    round: "עגילים עגולים",
    small: "עגילים קטנים",
    stud: "עגילי סטוד",
  };

  return labels[value] ?? value;
}

function isNumericValue(value: string) {
  return /^\d+$/u.test(value);
}
