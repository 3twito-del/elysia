import { ManualCheckoutForm } from "./_components/manual-checkout-form";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import {
  getCatalogBranches,
  getCatalogProductBySlug,
  getCatalogProductVariant,
  getFeaturedCatalogProducts,
} from "~/server/services/catalog";
import { TRPCReactProvider } from "~/trpc/react";

type CheckoutPageProps = {
  searchParams: Promise<{ product?: string; variant?: string }>;
};

export const metadata = {
  title: "סל וקופה",
};

export default async function CheckoutPage({
  searchParams,
}: CheckoutPageProps) {
  const params = await searchParams;
  const [branches, requestedProduct, fallbackProducts] = await Promise.all([
    getCatalogBranches(),
    params.product ? getCatalogProductBySlug(params.product) : null,
    getFeaturedCatalogProducts(1),
  ]);
  const product = requestedProduct ?? fallbackProducts[0];

  if (!product) {
    throw new Error("No active products are available for checkout.");
  }

  const variant = getCatalogProductVariant(product, params.variant);

  return (
    <main>
      <SiteHeader />
      <RevealSection>
        <TRPCReactProvider>
          <ManualCheckoutForm
            branches={branches.map((branch) => ({
              slug: branch.slug,
              name: branch.name,
              city: branch.city,
            }))}
            product={{
              slug: product.slug,
              name: product.name,
              shortDescription: product.shortDescription,
              price: product.price,
              variantName: variant?.name,
              variantSku: variant?.sku,
            }}
          />
        </TRPCReactProvider>
      </RevealSection>
    </main>
  );
}
