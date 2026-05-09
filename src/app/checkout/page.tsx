import { CartCheckoutForm } from "./_components/cart-checkout-form";
import { BrandPageIntro } from "~/components/brand-page-intro";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { brandMedia } from "~/lib/brand-media";
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
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-12">
          <BrandPageIntro
            description="סל, משלוח ואיסוף מסניף בממשק נקי, עם מסגרת Aqua/Champagne שמדגישה את רגע השירות ולא משנה את לוגיקת ההזמנה."
            eyebrow="Aphrodite Service"
            mediaAlt="Aqua jewelry checkout service tray"
            mediaPriority
            slides={brandMedia.service}
            title="קופה מאובטחת"
            variant="commerce"
          />
        </div>
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
