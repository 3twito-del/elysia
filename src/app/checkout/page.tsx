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
    <>
      <SiteHeader />

      <main>
        <CommercePageHero
          description="סל, משלוח עד הבית וקופה מאובטחת עם פרטי מסירה, שמירת מלאי ושירות לפני חיוב."
          eyebrow="קופה ושירות"
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
    </>
  );
}
