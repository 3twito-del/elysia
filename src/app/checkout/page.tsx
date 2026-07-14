import { CartCheckoutForm } from "./_components/cart-checkout-form";
import { CompactPageIntro } from "~/components/compact-page-intro";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata = {
  title: "סל הקניות",
  description: "השלמת הזמנה: פרטי משלוח, סיכום סל הקניות ותשלום.",
};

export default async function CheckoutPage() {
  return (
    <>
      <SiteHeader />

      <main className="elysia-page checkout-boutique-page">
        <CompactPageIntro
          className="checkout-boutique-hero"
          description="הפריטים שבחרת, פרטי משלוח וסיכום הזמנה לפני תשלום מאובטח."
          eyebrow="סל הקניות"
          title="סל הקניות"
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
