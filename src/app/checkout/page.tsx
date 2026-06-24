import { CartCheckoutForm } from "./_components/cart-checkout-form";
import { CompactPageIntro } from "~/components/compact-page-intro";
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

      <main className="elysia-page checkout-boutique-page">
        <CompactPageIntro
          className="checkout-boutique-hero"
          description="התכשיטים שבחרת, פרטי מסירה וסיכום קצר לפני תשלום מאובטח."
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
