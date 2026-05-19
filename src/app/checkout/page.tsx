import { CartCheckoutForm } from "./_components/cart-checkout-form";
import { CommercePageHero } from "~/components/commerce-page-hero";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata = {
  title: "סל וקופה",
};

export default async function CheckoutPage() {
  return (
    <main>
      <SiteHeader />
      <CommercePageHero
        description="סל, משלוח עד הבית וקופה מאובטחת בממשק נקי, עם שירות שמדגיש את רגע הרכישה."
        eyebrow="Aphrodite Service"
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
