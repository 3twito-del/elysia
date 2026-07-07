"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Search, Trash2, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

import type { WishlistProductSummary } from "../_lib/wishlist-products";
import { RevealGrid } from "~/components/reveal";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { EmptyState } from "~/components/ui/empty-state";
import { StatusMessage } from "~/components/ui/status-message";
import { formatPrice } from "~/lib/format";
import {
  clearGuestWishlistItems,
  readGuestWishlistSlugs,
  removeGuestWishlistItem,
  subscribeToGuestWishlist,
} from "~/lib/guest-wishlist";

type WishlistProductsResponse = {
  missingSlugs?: string[];
  products?: WishlistProductSummary[];
};

type LoadStatus = "error" | "loaded" | "loading";

export function GuestWishlistProducts() {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [slugs, setSlugs] = useState<string[]>([]);
  const [products, setProducts] = useState<WishlistProductSummary[]>([]);
  const [missingSlugs, setMissingSlugs] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;

    const syncWishlist = async () => {
      const nextSlugs = readGuestWishlistSlugs();

      setSlugs(nextSlugs);

      if (nextSlugs.length === 0) {
        setProducts([]);
        setMissingSlugs([]);
        setStatus("loaded");
        return;
      }

      setStatus("loading");

      try {
        const params = new URLSearchParams({ slugs: nextSlugs.join(",") });
        const response = await fetch(`/api/wishlist/products?${params}`, {
          headers: { Accept: "application/json" },
        });

        if (!response.ok) throw new Error("Wishlist products failed.");

        const data = (await response.json()) as WishlistProductsResponse;

        if (canceled) return;

        setProducts(data.products ?? []);
        setMissingSlugs(data.missingSlugs ?? []);
        setStatus("loaded");
      } catch {
        if (!canceled) {
          setStatus("error");
        }
      }
    };

    void syncWishlist();
    const unsubscribe = subscribeToGuestWishlist(() => {
      void syncWishlist();
    });
    const handleFocus = () => {
      void syncWishlist();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      canceled = true;
      unsubscribe();
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const isLoading = status === "loading";
  const hasSavedSlugs = slugs.length > 0;
  const hasProducts = products.length > 0;

  return (
    <Card
      className="account-boutique-panel wishlist-boutique-panel rounded-md"
      data-testid="wishlist-guest-panel"
      size="sm"
    >
      <CardHeader className="account-boutique-card-header">
        <CardTitle>מועדפים בדפדפן זה</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <GuestWishlistShortlistOnboarding hasSavedSlugs={hasSavedSlugs} />

        {message ? (
          <StatusMessage role="status" tone="success">
            {message}
          </StatusMessage>
        ) : null}

        {status === "error" ? (
          <StatusMessage role="alert" tone="error">
            לא ניתן לטעון את המועדפים כרגע. נסי לרענן בעוד רגע.
          </StatusMessage>
        ) : null}

        {isLoading ? (
          <div
            className="wishlist-loading-panel glass-inset rounded-md border p-4 text-sm"
            data-testid="wishlist-guest-loading"
          >
            טוענים את המועדפים שלך...
          </div>
        ) : null}

        {!isLoading && !hasSavedSlugs ? (
          <EmptyState
            actions={
              <>
                <Button asChild>
                  <Link href="/search">
                    <Search aria-hidden="true" className="size-4" />
                    חיפוש תכשיטים
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/account">
                    <UserRound aria-hidden="true" className="size-4" />
                    התחברות לחשבון
                  </Link>
                </Button>
              </>
            }
            description="פריטים שתסמני בלב יופיעו כאן, גם לפני התחברות לחשבון."
            icon={Heart}
            testId="wishlist-empty-guest"
            title="עדיין אין פריטים במועדפים"
            variant="inset"
          />
        ) : null}

        {!isLoading && hasSavedSlugs && !hasProducts ? (
          <EmptyState
            actions={
              <>
                <Button asChild variant="outline">
                  <Link href="/search">חיפוש תכשיטים</Link>
                </Button>
                <Button onClick={handleClearWishlist} type="button">
                  ניקוי מועדפים
                </Button>
              </>
            }
            description="הפריטים שנשמרו בדפדפן אינם זמינים עוד באתר."
            icon={Heart}
            testId="wishlist-missing-guest"
            title="המועדפים לא זמינים כרגע"
            variant="inset"
          />
        ) : null}

        {hasProducts ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-muted-foreground text-sm">
                {products.length} פריטים במועדפים בדפדפן הזה.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href="/account">התחברות לשמירה בחשבון</Link>
                </Button>
                <Button
                  onClick={handleClearWishlist}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  ניקוי
                </Button>
              </div>
            </div>

            {missingSlugs.length > 0 ? (
              <StatusMessage role="status" tone="neutral">
                חלק מהפריטים שנשמרו אינם זמינים עוד באתר.
              </StatusMessage>
            ) : null}

            <RevealGrid
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              data-testid="wishlist-guest-grid"
              variant="cards"
            >
              {products.map((product) => (
                <GuestWishlistProductCard
                  key={product.slug}
                  onRemove={handleRemoveProduct}
                  product={product}
                />
              ))}
            </RevealGrid>
          </>
        ) : null}
      </CardContent>
    </Card>
  );

  function handleRemoveProduct(product: WishlistProductSummary) {
    removeGuestWishlistItem(product.slug);
    setMessage(`${product.name} הוסר מהמועדפים.`);
  }

  function handleClearWishlist() {
    clearGuestWishlistItems();
    setMessage("רשימת המועדפים נוקתה.");
  }
}

function GuestWishlistShortlistOnboarding({
  hasSavedSlugs,
}: {
  hasSavedSlugs: boolean;
}) {
  return (
    <section
      aria-label="איך מועדפים מקומיים עובדים"
      className="grid gap-3 rounded-md border border-[var(--glass-border)] p-4 text-sm sm:grid-cols-[minmax(0,1fr)_auto]"
      data-testid="wishlist-guest-shortlist-onboarding"
    >
      <div>
        <p className="font-medium">
          {hasSavedSlugs
            ? "הרשימה נשמרת בדפדפן הזה"
            : "אפשר לשמור פריטים גם לפני התחברות"}
        </p>
        <p className="text-muted-foreground mt-1 leading-6">
          סמני לב בפריטים שמעניינים אותך, ואז היכנסי לחשבון כדי לשמור את
          הרשימה.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <Link
          className="border-border hover:border-foreground/50 hover:bg-muted/60 rounded-full border px-3 py-1.5 text-xs transition"
          href="/search"
        >
          המשך חיפוש
        </Link>
        <Link
          className="border-border hover:border-foreground/50 hover:bg-muted/60 rounded-full border px-3 py-1.5 text-xs transition"
          href="/account"
        >
          שמירה בחשבון
        </Link>
      </div>
    </section>
  );
}

function GuestWishlistProductCard({
  onRemove,
  product,
}: {
  onRemove: (product: WishlistProductSummary) => void;
  product: WishlistProductSummary;
}) {
  const productDetails = [product.material, product.stone, product.collection]
    .filter((detail): detail is string => Boolean(detail))
    .join(" · ");

  return (
    <article
      className="wishlist-product-card glass-inset grid min-w-0 gap-3 rounded-md border p-3"
      data-testid="wishlist-guest-product"
    >
      <Link
        className="group grid min-w-0 gap-3 outline-none focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)]"
        href={`/product/${product.slug}`}
      >
        <span className="wishlist-product-thumb bg-muted relative aspect-[4/3] overflow-hidden rounded-md border">
          <Image
            alt={product.name}
            className="media-color object-cover transition duration-500 group-hover:scale-[1.02]"
            fill
            sizes="(min-width: 1024px) 20rem, (min-width: 640px) 50vw, 100vw"
            src={product.image}
          />
        </span>
        <span className="grid min-w-0 gap-1">
          <span className="truncate font-medium">{product.name}</span>
          <span className="text-muted-foreground truncate text-xs">
            {productDetails || product.categoryName}
          </span>
          <span className="text-sm font-medium">
            {formatPrice(product.price)}
          </span>
        </span>
      </Link>
      <Button
        aria-label={`הסרת ${product.name} מהמועדפים`}
        className="justify-self-start"
        onClick={() => onRemove(product)}
        size="sm"
        type="button"
        variant="outline"
      >
        <Trash2 aria-hidden="true" className="size-4" />
        הסרה
      </Button>
    </article>
  );
}
