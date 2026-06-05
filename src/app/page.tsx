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
    title: "צילום",
    text: "תאורה טבעית, רקע נקי וקרבה מספקת כדי לראות חומר וגימור.",
  },
  {
    image: "/brand/boutique/category-necklaces.avif",
    title: "פרופורציה",
    text: "בחינת אורך, משקל ונראות על הגוף לפני הרחבת המבחר.",
  },
  {
    image: "/brand/boutique/category-bracelets.avif",
    title: "שימוש",
    text: "פריטים שנועדו לענידה יומיומית, עם גימור ברור ונראות מאופקת.",
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
    title: "חומר",
    text: "כל פריט יכלול מידע ברור על חומר, ציפוי ואופן תחזוקה.",
  },
  {
    title: "מידה",
    text: "אורך, היקף ומשקל ייבדקו מול שימוש יומיומי ונוחות ענידה.",
  },
  {
    title: "מבחר",
    text: "הקולקציה תיפתח במבחר מצומצם במקום ברשימת מוצרים רחבה מדי.",
  },
] as const;

export const metadata: Metadata = {
  title: "Elysia | הקולקציה הראשונה בדרך",
  description:
    "Elysia הוא מותג תכשיטים בהקמה עם קולקציה ראשונה מצומצמת, מידע חומרי ברור ותהליך בחירה מדויק.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Elysia | הקולקציה הראשונה בדרך",
    description:
      "מותג תכשיטים בהקמה עם קולקציה ראשונה מצומצמת ותהליך בחירה מבוקר.",
    url: "/",
    images: [{ url: boutiqueHeroImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elysia | הקולקציה הראשונה בדרך",
    description:
      "מותג תכשיטים בהקמה עם קולקציה ראשונה מצומצמת ותהליך בחירה מבוקר.",
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
            Jewellery selected by material, fit, and finish.
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
          eyebrow="כיוון האתר"
          title="צילום, פרופורציה, שימוש."
          text="דף הבית מציג את שפת המותג ואת הקריטריונים לקולקציה לפני כניסה למוצרים."
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
                  alt={`${principle.title} - כיוון חזותי עבור Elysia`}
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
              eyebrow="הקולקציה הראשונה"
              title="מבחר מצומצם לפי חומר, גימור ומידה."
              text="עד לפרסום הפריטים הסופיים, האתר מציג כיוון חזותי וקריטריוני בחירה במקום קטלוג מלאכותי."
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
          eyebrow="קריטריונים"
          title="המידע שיוצג לפני פתיחת המכירה."
          text="הקולקציה תוצג עם נתוני חומר, מידה, גימור והמלצות תחזוקה."
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
        <div className="prelaunch-media-note">
          <div className="prelaunch-journal">
            <p className="prelaunch-eyebrow">עדכונים</p>
            <h2>תיעוד התקדמות הקולקציה.</h2>
            <p>
              אזור זה ירכז עדכונים קצרים על בחירת פריטים, בדיקות חומר,
              צילומים ותאריכי פתיחה.
            </p>
          </div>
          <figure className="prelaunch-note-image">
            <Image
              alt="צילום תקריב של תכשיט לצורך תיעוד קולקציה"
              className="object-cover"
              fill
              sizes="(min-width: 1024px) 32vw, 100vw"
              src="/brand/boutique/product-detail.avif"
            />
          </figure>
        </div>
      </RevealSection>

      <RevealSection
        className="prelaunch-section prelaunch-waitlist-section"
        id="waitlist"
      >
        <div className="prelaunch-waitlist-grid">
          <div>
            <p className="prelaunch-eyebrow">עדכון השקה</p>
            <h2>קבלת הודעה כשהקולקציה נפתחת.</h2>
            <p>
              נשלח הודעה אחת עם פתיחת הקולקציה הראשונה ופרטי זמינות ראשוניים.
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
        <div className="prelaunch-media-note prelaunch-media-note-reverse">
          <div className="prelaunch-about">
            <p className="prelaunch-eyebrow">על Elysia</p>
            <h2>מותג תכשיטים בהקמה.</h2>
            <p>
              Elysia מתמקדת במבחר תכשיטים מצומצם, צילום ברור, מידע חומרי
              נגיש ותהליך רכישה פשוט.
            </p>
          </div>
          <figure className="prelaunch-note-image">
            <Image
              alt="צילום שרשרת עדינה כחלק משפת המותג"
              className="object-cover"
              fill
              sizes="(min-width: 1024px) 32vw, 100vw"
              src="/brand/boutique/category-necklaces.avif"
            />
          </figure>
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
