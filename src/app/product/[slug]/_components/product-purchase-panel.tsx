"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Heart, PackageCheck, Sparkles } from "lucide-react";

import { WishlistButton } from "./wishlist-button";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  dispatchCartUpdated,
  getOrCreateCartSessionKey,
} from "~/lib/cart-session";
import type { CatalogProductVariant } from "~/server/services/catalog";
import { api } from "~/trpc/react";

type ProductPurchasePanelProps = {
  productSlug: string;
  variants: CatalogProductVariant[];
  metalColors: string[];
};

export function ProductPurchasePanel({
  productSlug,
  variants,
  metalColors,
}: ProductPurchasePanelProps) {
  const [selectedSku, setSelectedSku] = useState(variants[0]?.sku ?? "");
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const selectedVariant =
    variants.find((variant) => variant.sku === selectedSku) ?? variants[0];
  const addItem = api.cart.addItem.useMutation({
    onSuccess: () => {
      setCartMessage("הפריט נוסף לסל");
      dispatchCartUpdated();
    },
    onError: (error) => {
      setCartMessage(error.message);
    },
  });

  function handleAddToCart() {
    if (!selectedVariant) return;

    addItem.mutate({
      sessionKey: getOrCreateCartSessionKey(),
      variantSku: selectedVariant.sku,
      quantity: 1,
    });
  }

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
        <Button
          disabled={!selectedVariant || addItem.isPending}
          onClick={handleAddToCart}
          size="lg"
          type="button"
        >
          {addItem.isPending ? "מוסיף..." : "הוספה לסל"}
          <PackageCheck className="size-4" />
        </Button>
        <WishlistButton productSlug={productSlug}>
          שמירה
          <Heart className="size-4" />
        </WishlistButton>
      </div>

      {cartMessage ? (
        <div className="glass-inset flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="size-4" />
            {cartMessage}
          </span>
          <Button asChild size="sm" variant="secondary">
            <Link href="/checkout">מעבר לסל</Link>
          </Button>
        </div>
      ) : null}

      <Button asChild variant="secondary">
        <Link href={`/ai?product=${productSlug}`}>
          מדידה/AI
          <Sparkles className="size-4" />
        </Link>
      </Button>
    </div>
  );
}
