import Link from "next/link";

import { CartCheckoutForm } from "./_components/cart-checkout-form";
import { CompactPageIntro } from "~/components/compact-page-intro";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
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
      <CompactPageIntro
        actions={
          <>
            <Button asChild>
              <Link href="#checkout-form">להמשך לקופה</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="#checkout-service">אפשרויות שירות</Link>
            </Button>
          </>
        }
        description="סל, משלוח ואיסוף מסניף בממשק נקי, עם שירות שמדגיש את רגע הרכישה."
        eyebrow="Aphrodite Service"
        metrics={[
          { label: "סניפים", value: String(branches.length) },
          { label: "קופה", value: "מאובטחת" },
          { label: "איסוף", value: "בתיאום" },
        ]}
        title="קופה מאובטחת"
      />
      <RevealSection id="checkout-form">
        <div id="checkout-service" />
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
