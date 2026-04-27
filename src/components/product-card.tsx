import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin, ShoppingBag } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { formatPrice, type Product } from "~/lib/catalog";

export function ProductCard({ product }: { product: Product }) {
  const availableBranches = Object.values(product.inventory).filter(
    Boolean,
  ).length;

  return (
    <Card className="h-full overflow-hidden rounded-md border-black/10 bg-white/55 py-0 shadow-none ring-1 ring-black/[0.02] backdrop-blur transition duration-200 focus-within:border-black/30 hover:-translate-y-0.5 hover:border-black/20 hover:bg-white/75">
      <Link
        aria-label={`צפייה במוצר ${product.name}`}
        className="block focus-visible:outline-none"
        href={`/product/${product.slug}`}
      >
        <div className="relative aspect-square overflow-hidden bg-black/[0.04]">
          <Image
            alt={product.name}
            className="object-cover transition duration-300 hover:scale-[1.03]"
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            src={product.image}
          />
          <Badge className="text-foreground absolute top-3 right-3 bg-white/70 font-normal shadow-none backdrop-blur">
            {product.collection}
          </Badge>
        </div>
      </Link>
      <CardContent className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link
              className="font-medium hover:underline"
              href={`/product/${product.slug}`}
            >
              {product.name}
            </Link>
            <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
              {product.shortDescription}
            </p>
          </div>
          <Button
            aria-label="שמירה ל-Wishlist"
            className="shrink-0"
            size="icon"
            type="button"
            variant="ghost"
          >
            <Heart className="size-4" />
          </Button>
        </div>

        <div className="mt-auto grid gap-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">
              {formatPrice(product.price)}
            </span>
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              <MapPin className="size-3.5" />
              {availableBranches} סניפים
            </span>
          </div>
          <Button asChild className="w-full gap-2" variant="outline">
            <Link
              aria-label={`צפייה וקנייה: ${product.name}`}
              href={`/product/${product.slug}`}
            >
              <ShoppingBag className="size-4" />
              צפייה וקנייה
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
