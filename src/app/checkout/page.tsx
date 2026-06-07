import { CartCheckoutForm } from "./_components/cart-checkout-form";
import { CommercePageHero } from "~/components/commerce-page-hero";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata = {
  title: "הסל שלך",
};

export default async function CheckoutPage() {
  return (
    <>
      <SiteHeader />

      <main className="checkout-boutique-page">
        <CommercePageHero
          className="checkout-boutique-hero"
          description="התכשיטים שבחרת, פרטי מסירה ושאלה אחרונה לפני התשלום."
          eyebrow="סל"
          title="הסל שלך"
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
