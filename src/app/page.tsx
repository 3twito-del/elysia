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
    title: "Light",
    text: "A soft glow across skin, metal, and shadow before any product story begins.",
  },
  {
    image: "/brand/boutique/category-necklaces.avif",
    title: "Detail",
    text: "Near-body jewellery moments that feel touched, worn, and close.",
  },
  {
    image: "/brand/boutique/category-bracelets.avif",
    title: "Intimacy",
    text: "Quiet silhouettes, warm texture, and restraint instead of catalogue noise.",
  },
] as const;

const collectionSignals = [
  {
    image: "/brand/boutique/category-rings.avif",
    label: "Slender forms",
  },
  {
    image: "/brand/boutique/category-earrings.avif",
    label: "Skin-close shine",
  },
  {
    image: "/brand/boutique/category-bracelets.avif",
    label: "Soft daily layering",
  },
] as const;

const curationCriteria = [
  {
    title: "Material honesty",
    text: "Only pieces with clear material information and a finish that supports daily wear will enter the first collection.",
  },
  {
    title: "Body proportion",
    text: "Scale, drape, and silhouette matter before quantity. Each direction is judged by how it sits near the body.",
  },
  {
    title: "Quiet longevity",
    text: "The collection should feel feminine and current without becoming loud, seasonal, or disposable.",
  },
] as const;

export const metadata: Metadata = {
  title: "Elysia | First collection coming soon",
  description:
    "Elysia is a pre-launch jewellery brand world for soft gold, skin-close detail, and quiet light.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Elysia | First collection coming soon",
    description:
      "A boutique jewellery brand world in formation: soft gold, skin-close detail, and quiet light.",
    url: "/",
    images: [{ url: boutiqueHeroImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elysia | First collection coming soon",
    description:
      "A boutique jewellery brand world in formation: soft gold, skin-close detail, and quiet light.",
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
                <Link data-testid="home-hero-primary-cta" href="#waitlist">
                  Join the first collection
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
          eyebrow="The Elysia mood"
          title="Light, detail, intimacy."
          text="The site now opens as a brand atmosphere before it behaves like a store."
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
                  alt={`${principle.title} mood direction for Elysia`}
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
              eyebrow="The coming first collection"
              title="Carefully selected, never mass-listed."
              text="Until the real pieces are chosen, the homepage should show the visual direction: silhouettes, texture, and mood rather than fake inventory depth."
            />
          </div>
          <div
            className="prelaunch-collection-board"
            data-testid="prelaunch-first-collection-board"
          >
            {collectionSignals.map((signal) => (
              <figure className="prelaunch-signal" key={signal.label}>
                <Image
                  alt={`${signal.label} visual direction`}
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
          eyebrow="Curation criteria"
          title="Standards before claims."
          text="Material standards will be presented as selection criteria until the final collection is confirmed."
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
          <p className="prelaunch-eyebrow">Journal</p>
          <h2>Notes on light, metal, and the first edit.</h2>
          <p>
            The journal will hold the visual research behind Elysia: references,
            material notes, silhouette studies, and the slow formation of the
            first collection.
          </p>
        </div>
      </RevealSection>

      <RevealSection
        className="prelaunch-section prelaunch-waitlist-section"
        id="waitlist"
      >
        <div className="prelaunch-waitlist-grid">
          <div>
            <p className="prelaunch-eyebrow">Join the first collection</p>
            <h2>Enter the world before the store opens.</h2>
            <p>
              Receive the first collection note when Elysia is ready to reveal
              its edited selection.
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
          <p className="prelaunch-eyebrow">About Elysia</p>
          <h2>A boutique jewellery brand in formation.</h2>
          <p>
            Elysia is being shaped around feminine minimal elegance: warm light,
            skin-close details, restrained shine, and a first collection chosen
            with care rather than volume.
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
