import { CartCheckoutForm } from "./_components/cart-checkout-form";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { getCatalogBranches } from "~/server/services/catalog";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata = {
  title: "סל וקופה",
};

export default async function CheckoutPage() {
  const branches = await getCatalogBranches();

  return (
    <main>
      <SiteHeader />
      <RevealSection>
        <TRPCReactProvider>
          <CartCheckoutForm
            branches={branches.map((branch) => ({
              slug: branch.slug,
              name: branch.name,
              city: branch.city,
            }))}
          />
        </TRPCReactProvider>
      </RevealSection>
    </main>
  );
}
