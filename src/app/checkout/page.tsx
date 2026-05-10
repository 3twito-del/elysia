import Link from "next/link";

import { CartCheckoutForm } from "./_components/cart-checkout-form";
import { BrandPageIntro } from "~/components/brand-page-intro";
import { CinematicPageHero } from "~/components/cinematic-page-hero";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { brandMedia, cinematicRouteMedia } from "~/lib/brand-media";
import { getCatalogBranches } from "~/server/services/catalog";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata = {
  title: "סל וקופה",
};

export default async function CheckoutPage() {
  const branches = await getCatalogBranches();
  const checkoutAnchors = [
    { id: "page-hero", label: "פתיחה" },
    { id: "checkout-form", label: "קופה" },
    { id: "checkout-service", label: "שירות" },
  ];

  return (
    <main>
      <SiteHeader />
      <CinematicPageHero
        actions={
          <>
            <Button asChild size="lg">
              <Link href="#checkout-form">להמשך לקופה</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#checkout-service">אפשרויות שירות</Link>
            </Button>
          </>
        }
        anchors={checkoutAnchors}
        description="סל, משלוח ואיסוף מסניף בממשק נקי, עם שירות שמדגיש את רגע הרכישה."
        eyebrow="Aphrodite Service"
        slides={cinematicRouteMedia.checkout}
        stats={[
          { label: "סניפים", value: String(branches.length) },
          { label: "קופה", value: "מאובטחת" },
          { label: "איסוף", value: "בתיאום" },
        ]}
        title="קופה מאובטחת"
        variant="service"
      />
      <RevealSection id="checkout-form">
        <div className="hidden">
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
