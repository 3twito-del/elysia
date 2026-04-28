"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, PackageCheck, Sparkles } from "lucide-react";

import { WishlistButton } from "./wishlist-button";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import type { ProductVariant } from "~/lib/catalog";

type ProductPurchasePanelProps = {
  productSlug: string;
  variants: ProductVariant[];
  metalColors: string[];
};

export function ProductPurchasePanel({
  productSlug,
  variants,
  metalColors,
}: ProductPurchasePanelProps) {
  const [selectedSku, setSelectedSku] = useState(variants[0]?.sku ?? "");
  const selectedVariant =
    variants.find((variant) => variant.sku === selectedSku) ?? variants[0];
  const checkoutHref = selectedVariant
    ? `/checkout?product=${productSlug}&variant=${selectedVariant.sku}`
    : `/checkout?product=${productSlug}`;

  return (
    <div className="grid gap-5">
      <div className="grid gap-5">
        <div>
          <p className="mb-2 text-sm font-medium">מידה / וריאציה</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <Button
                aria-pressed={selectedSku === variant.sku}
                className="min-h-11 min-w-11 px-4"
                key={variant.sku}
                onClick={() => setSelectedSku(variant.sku)}
                type="button"
                variant={selectedSku === variant.sku ? "secondary" : "outline"}
              >
                {variant.size ?? variant.name}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">צבע מתכת</p>
          <div className="flex flex-wrap gap-2">
            {metalColors.map((color) => (
              <Badge key={color} variant="secondary">
                {color}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button asChild size="lg">
          <Link href={checkoutHref}>
            הוספה לסל
            <PackageCheck className="size-4" />
          </Link>
        </Button>
        <WishlistButton productSlug={productSlug}>
          שמירה
          <Heart className="size-4" />
        </WishlistButton>
      </div>

      <Button asChild variant="secondary">
        <Link href={`/stylist?product=${productSlug}`}>
          מדידה/AI
          <Sparkles className="size-4" />
        </Link>
      </Button>
    </div>
  );
}
