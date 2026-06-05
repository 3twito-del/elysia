import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { NewsletterForm } from "~/components/newsletter-form";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";

const boutiqueHeroImage = "/brand/boutique/lifestyle-hero.avif";

const moodPrinciples = [
  {
    image: "/brand/boutique/product-detail.avif",
    title: "אור",
    text: "זוהר רך על עור, מתכת וצל לפני שמתחיל סיפור של פריט.",
  },
  {
    image: "/brand/boutique/category-necklaces.avif",
    title: "פרט",
    text: "רגעי תכשיט קרובים לגוף, בתחושה נלבשת, נוגעת ואינטימית.",
  },
  {
    image: "/brand/boutique/category-bracelets.avif",
    title: "אינטימיות",
    text: "צלליות שקטות, טקסטורה חמימה ואיפוק במקום רעש קטלוגי.",
  },
] as const;

const collectionSignals = [
  {
    image: "/brand/boutique/category-rings.avif",
    label: "צורות עדינות",
  },
  {
    image: "/brand/boutique/category-earrings.avif",
    label: "ברק קרוב לעור",
  },
  {
    image: "/brand/boutique/category-bracelets.avif",
    label: "שכבות יומיומיות רכות",
  },
] as const;

const curationCriteria = [
  {
    title: "כנות חומרית",
    text: "רק פריטים עם מידע חומרי ברור וגימור שמתאים לענידה יומיומית ייכנסו לקולקציה הראשונה.",
  },
  {
    title: "מידתיות על הגוף",
    text: "קנה מידה, נפילה וצללית קודמים לכמות. כל כיוון נבחן לפי האופן שבו הוא יושב קרוב לגוף.",
  },
  {
    title: "שקט שנשאר",
    text: "הקולקציה צריכה להרגיש נשית ועכשווית בלי להפוך לצעקנית, עונתית או חולפת.",
  },
] as const;

export const metadata: Metadata = {
  title: "Elysia | הקולקציה הראשונה בדרך",
  description:
    "Elysia הוא עולם מותגי לתכשיטים נשיים, אור רך, פרטים קרובים לעור ואלגנטיות שקטה.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Elysia | הקולקציה הראשונה בדרך",
    description:
      "עולם מותגי בוטיקי בהתהוות: זהב רך, פרטים קרובים לעור ואור שקט.",
    url: "/",
    images: [{ url: boutiqueHeroImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elysia | הקולקציה הראשונה בדרך",
    description:
      "עולם מותגי בוטיקי בהתהוות: זהב רך, פרטים קרובים לעור ואור שקט.",
    images: [boutiqueHeroImage],
  },
};

export default function Home() {
  return (
    <main
      className="home-luxury-page prelaunch-home-page"
      data-testid="prelaunch-homepage"
    >
      <SiteHeader />

      <RevealSection
        className="home-cinematic-hero prelaunch-hero relative isolate min-h-[var(--home-hero-height)] w-screen max-w-none overflow-hidden"
        data-testid="cinematic-page-hero"
        id="page-hero"
        initialVisible
        variant="hero"
      >
        <Image
          alt="Close-up gold jewellery worn near skin in soft natural light"
          className="prelaunch-hero-image object-cover"
          fill
          priority
          sizes="100vw"
          src={boutiqueHeroImage}
        />
        <div className="prelaunch-hero-scrim absolute inset-0" />
        <div className="prelaunch-hero-luminosity absolute inset-0" />

        <div
          className="home-hero-copy motion-hero-copy prelaunch-hero-copy absolute z-10 flex max-w-[min(38rem,calc(100vw-2.5rem))] flex-col items-start text-left sm:max-w-[min(40rem,42vw)]"
          data-testid="home-hero-copy"
          dir="ltr"
        >
          <h1 className="home-hero-wordmark motion-copy-item prelaunch-hero-wordmark">
            Elysia
          </h1>
          <p
            className="home-hero-statement motion-copy-item prelaunch-hero-statement [--motion-copy-delay:90ms]"
            data-testid="home-hero-statement"
          >
            Soft gold, close to skin.
          </p>
          <div
            className="home-hero-actions motion-copy-item prelaunch-hero-actions [--motion-copy-delay:130ms]"
            data-testid="home-hero-actions"
          >
            <div className="home-hero-cta-row" data-testid="home-hero-cta-row">
              <Button asChild className="home-hero-cta-primary" size="lg">
                <Link
                  data-testid="home-hero-primary-cta"
                  dir="rtl"
                  href="#waitlist"
                >
                  הצטרפות לקולקציה הראשונה
                  <ArrowRight
                    aria-hidden="true"
                    className="home-hero-cta-icon size-4"
                  />
                </Link>
              </Button>
            </div>
            <p
              className="prelaunch-hero-secondary-line"
              data-testid="home-hero-secondary-line"
            >
              First collection coming soon
            </p>
          </div>
        </div>
      </RevealSection>

      <RevealSection
        className="prelaunch-section prelaunch-mood-section"
        id="mood"
      >
        <SectionIntro
          eyebrow="האווירה של Elysia"
          title="אור, פרט, אינטימיות."
          text="דף הבית נפתח קודם כעולם מותגי, ורק אחר כך ככניסה לחנות."
        />
        <RevealGrid
          className="prelaunch-mood-grid"
          data-layout-equal-group="prelaunch-mood-principles"
          variant="media"
        >
          {moodPrinciples.map((principle) => (
            <figure className="prelaunch-mood-item" key={principle.title}>
              <span className="prelaunch-mood-image">
                <Image
                  alt={`${principle.title} - כיוון אווירה עבור Elysia`}
                  className="object-cover"
                  fill
                  sizes="(min-width: 1024px) 28vw, (min-width: 640px) 50vw, 100vw"
                  src={principle.image}
                />
              </span>
              <figcaption>
                <h3>{principle.title}</h3>
                <p>{principle.text}</p>
              </figcaption>
            </figure>
          ))}
        </RevealGrid>
      </RevealSection>

      <RevealSection
        className="prelaunch-section prelaunch-first-collection-section"
        id="first-collection"
      >
        <div className="prelaunch-split">
          <div className="prelaunch-split-copy">
            <SectionIntro
              eyebrow="הקולקציה הראשונה בדרך"
              title="נבחר בקפידה, לא נערם כמלאי."
              text="עד שהפריטים הסופיים יאושרו, דף הבית מציג את הכיוון החזותי: צלליות, טקסטורה ואווירה במקום עומק מלאי מדומה."
            />
          </div>
          <div
            className="prelaunch-collection-board"
            data-testid="prelaunch-first-collection-board"
          >
            {collectionSignals.map((signal) => (
              <figure className="prelaunch-signal" key={signal.label}>
                <Image
                  alt={`${signal.label} - כיוון חזותי`}
                  className="object-cover"
                  fill
                  sizes="(min-width: 1024px) 18vw, 33vw"
                  src={signal.image}
                />
                <figcaption>{signal.label}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </RevealSection>

      <RevealSection
        className="prelaunch-section prelaunch-criteria-section"
        id="materials"
      >
        <SectionIntro
          eyebrow="קריטריוני אוצרות"
          title="סטנדרטים לפני הבטחות."
          text="סטנדרטים של חומר, גימור ותחושת ענידה יוצגו כקריטריוני בחירה עד לאישור הקולקציה הסופית."
        />
        <div
          className="prelaunch-criteria-grid"
          data-testid="prelaunch-curation-criteria"
        >
          {curationCriteria.map((item, index) => (
            <section className="prelaunch-criterion" key={item.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </section>
          ))}
        </div>
      </RevealSection>

      <RevealSection
        className="prelaunch-section prelaunch-journal-section"
        id="journal"
      >
        <div className="prelaunch-journal">
          <p className="prelaunch-eyebrow">יומן</p>
          <h2>רשימות על אור, מתכת והעריכה הראשונה.</h2>
          <p>
            היומן ירכז את המחקר החזותי שמאחורי Elysia: רפרנסים, הערות חומר,
            בחינת צלליות וההתהוות האיטית של הקולקציה הראשונה.
          </p>
        </div>
      </RevealSection>

      <RevealSection
        className="prelaunch-section prelaunch-waitlist-section"
        id="waitlist"
      >
        <div className="prelaunch-waitlist-grid">
          <div>
            <p className="prelaunch-eyebrow">הצטרפות לקולקציה הראשונה</p>
            <h2>להיכנס לעולם לפני שהחנות נפתחת.</h2>
            <p>
              נשלח הודעה ראשונה כש־Elysia תהיה מוכנה לחשוף את הבחירה הערוכה
              של הקולקציה הראשונה.
            </p>
          </div>
          <div className="prelaunch-waitlist-form">
            <NewsletterForm />
          </div>
        </div>
      </RevealSection>

      <RevealSection
        className="prelaunch-section prelaunch-about-section"
        id="about-elysia"
      >
        <div className="prelaunch-about">
          <p className="prelaunch-eyebrow">על Elysia</p>
          <h2>מותג תכשיטים בוטיקי בהתהוות.</h2>
          <p>
            Elysia מתגבשת סביב אלגנטיות נשית ומינימלית: אור חמים, פרטים
            קרובים לעור, ברק מאופק וקולקציה ראשונה שנבחרת בקפידה ולא בכמות.
          </p>
        </div>
      </RevealSection>
    </main>
  );
}

function SectionIntro({
  eyebrow,
  text,
  title,
}: {
  eyebrow: string;
  text: string;
  title: string;
}) {
  return (
    <div className="prelaunch-section-intro">
      <p className="prelaunch-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}
