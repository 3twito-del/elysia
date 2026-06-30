import type { CinematicHeroSlide } from "~/components/cinematic-hero-sequence";

const boutiqueMedia = {
  bracelets: {
    alt: "צמידי זהב עדינים על משי ואבן בהירה",
    src: "/brand/boutique/category-bracelets.avif",
  },
  earrings: {
    alt: "עגילי פנינה וזהב בתקריב רך",
    src: "/brand/boutique/category-earrings.avif",
  },
  hero: {
    alt: "תכשיט זהב עדין על גוף בתאורת חלון רכה",
    src: "/brand/boutique/lifestyle-hero.avif",
  },
  necklaces: {
    alt: "שרשראות זהב עדינות על גוף בתאורה רכה",
    src: "/brand/boutique/category-necklaces.avif",
  },
  rings: {
    alt: "טבעות זהב עדינות על משי ואבן בהירה",
    src: "/brand/boutique/category-rings.avif",
  },
  sets: {
    alt: "תכשיטים עדינים בעריכה מוכנה למתנה",
    src: "/brand/boutique/product-detail.avif",
  },
} satisfies Record<string, CinematicHeroSlide>;

export const brandHeroSlides = [
  boutiqueMedia.hero,
  boutiqueMedia.rings,
  boutiqueMedia.earrings,
] satisfies CinematicHeroSlide[];

export const cinematicRouteMedia = {
  accessibility: [boutiqueMedia.hero, boutiqueMedia.earrings],
  account: [boutiqueMedia.bracelets, boutiqueMedia.hero],
  ai: [boutiqueMedia.rings, boutiqueMedia.necklaces],
  about: [boutiqueMedia.necklaces, boutiqueMedia.hero],
  checkout: [boutiqueMedia.bracelets, boutiqueMedia.rings],
  faq: [boutiqueMedia.hero, boutiqueMedia.earrings],
  gifts: [boutiqueMedia.bracelets, boutiqueMedia.rings],
  home: [boutiqueMedia.hero, boutiqueMedia.necklaces, boutiqueMedia.rings],
  legal: [boutiqueMedia.hero, boutiqueMedia.earrings],
  product: [boutiqueMedia.hero, boutiqueMedia.rings],
  search: [boutiqueMedia.rings, boutiqueMedia.necklaces],
  service: [boutiqueMedia.bracelets, boutiqueMedia.hero],
  stylist: [boutiqueMedia.necklaces, boutiqueMedia.earrings],
} satisfies Record<string, CinematicHeroSlide[]>;

export const brandMedia = {
  about: cinematicRouteMedia.about,
  ai: cinematicRouteMedia.ai,
  gifts: cinematicRouteMedia.gifts,
  policy: cinematicRouteMedia.legal,
  search: cinematicRouteMedia.search,
  service: cinematicRouteMedia.service,
} satisfies Record<string, CinematicHeroSlide[]>;

const categorySlides = {
  bracelets: [boutiqueMedia.bracelets, boutiqueMedia.hero],
  earrings: [boutiqueMedia.earrings, boutiqueMedia.hero],
  necklaces: [boutiqueMedia.necklaces, boutiqueMedia.hero],
  rings: [boutiqueMedia.rings, boutiqueMedia.hero],
  sets: [boutiqueMedia.sets, boutiqueMedia.necklaces],
} satisfies Record<string, CinematicHeroSlide[]>;

export type CinematicRouteMediaKey = keyof typeof cinematicRouteMedia;

export function getCinematicRouteSlides(key: CinematicRouteMediaKey) {
  return cinematicRouteMedia[key] ?? cinematicRouteMedia.home;
}

export function getCategoryBrandSlides(slug: string) {
  return categorySlides[slug as keyof typeof categorySlides] ?? brandHeroSlides;
}
