import { ManualCheckoutForm } from "./_components/manual-checkout-form";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { branches, getProductBySlug, products } from "~/lib/catalog";
import { TRPCReactProvider } from "~/trpc/react";

type CheckoutPageProps = {
  searchParams: Promise<{ product?: string }>;
};

export const metadata = {
  title: "סל וקופה",
};

export default async function CheckoutPage({
  searchParams,
}: CheckoutPageProps) {
  const params = await searchParams;
  const product = getProductBySlug(params.product ?? "") ?? products[0]!;

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
            }}
          />
        </TRPCReactProvider>
      </RevealSection>
    </main>
  );
}
