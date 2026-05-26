import { CartCheckoutForm } from "./_components/cart-checkout-form";
import { CommercePageHero } from "~/components/commerce-page-hero";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata = {
  title: "הבחירה שלי",
};

export default async function CheckoutPage() {
  return (
    <>
      <SiteHeader />

      <main>
        <CommercePageHero
          description="סיכום פריטים, פרטי משלוח ואישור הזמנה."
          eyebrow="הבחירה שלי"
          title="סיום הזמנה"
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
