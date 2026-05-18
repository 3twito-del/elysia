import Link from "next/link";

import { CartCheckoutForm } from "./_components/cart-checkout-form";
import { CommercePageHero } from "~/components/commerce-page-hero";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { cinematicRouteMedia } from "~/lib/brand-media";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata = {
  title: "סל וקופה",
};

export default async function CheckoutPage() {
  return (
    <main>
      <SiteHeader />
      <CommercePageHero
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
        description="סל, משלוח עד הבית וקופה מאובטחת בממשק נקי, עם שירות שמדגיש את רגע הרכישה."
        eyebrow="Aphrodite Service"
        media={{
          alt: "Aphrodite checkout",
          priority: true,
          slides: cinematicRouteMedia.checkout,
        }}
        metrics={[
          { label: "אונליין", value: "בלבד" },
          { label: "קופה", value: "מאובטחת" },
          { label: "משלוח", value: "עד הבית" },
        ]}
        title="קופה מאובטחת"
        variant="checkout"
      />
      <RevealSection id="checkout-form">
        <div id="checkout-service" />
        <TRPCReactProvider>
          <CartCheckoutForm />
        </TRPCReactProvider>
      </RevealSection>
    </main>
  );
}
