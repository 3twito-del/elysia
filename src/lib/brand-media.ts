import type { CinematicHeroSlide } from "~/components/cinematic-hero-sequence";

export const brandHeroSlides = [
  {
    alt: "טבעות יהלום על משטח סטודיו בגוון אקווה",
    src: "/brand/aphrodite-aqua-hero-rings.avif",
  },
  {
    alt: "תכשיטי פנינה על זכוכית טורקיז",
    src: "/brand/aphrodite-aqua-hero-pearls.avif",
  },
  {
    alt: "תכשיטי יהלום וזכוכית בתאורת סטודיו אקווה",
    src: "/brand/aphrodite-aqua-hero-glass.avif",
  },
] satisfies CinematicHeroSlide[];

export const cinematicRouteMedia = {
  accessibility: [
    {
      alt: "סצנת תכשיטי פנינה רכה למידע נגישות",
      src: "/brand/cinematic/cinematic-editorial.avif",
    },
    {
      alt: "זכוכית אקווה ותכשיטי פנינה בעיצוב שקט",
      src: "/brand/cinematic/cinematic-policy.avif",
    },
  ],
  account: [
    {
      alt: "מגש שירות תכשיטים עם פנינים וזכוכית אקווה לאזור לקוח",
      src: "/brand/cinematic/cinematic-service-v2.avif",
    },
    brandHeroSlides[2]!,
  ],
  ai: [
    {
      alt: "תכשיטים על מגש זכוכית אקווה להתאמה אישית",
      src: "/brand/cinematic/cinematic-catalog-v2.avif",
    },
    brandHeroSlides[2]!,
  ],
  about: [
    {
      alt: "סצנת תכשיטים עריכתית בגוון Aphrodite Aqua",
      src: "/brand/cinematic/cinematic-editorial.avif",
    },
    brandHeroSlides[1]!,
  ],
  checkout: [
    {
      alt: "מגש אריזה ושירות לקופה ומשלוח תכשיטים",
      src: "/brand/cinematic/cinematic-service-v2.avif",
    },
    brandHeroSlides[2]!,
  ],
  faq: [
    {
      alt: "סצנת מידע רכה עם זכוכית אקווה ופנינים",
      src: "/brand/cinematic/cinematic-policy.avif",
    },
    {
      alt: "סצנת תכשיטים עריכתית בגוון Aphrodite Aqua",
      src: "/brand/cinematic/cinematic-editorial.avif",
    },
  ],
  gifts: [
    {
      alt: "תכשיטי מתנה על מגש זכוכית אקווה ומשטח אבן כהה",
      src: "/brand/cinematic/cinematic-catalog-v2.avif",
    },
    brandHeroSlides[1]!,
  ],
  home: [
    {
      alt: "סצנת תכשיטי יוקרה בתאורת סטודיו אקווה",
      src: "/brand/cinematic/cinematic-home.avif",
    },
    ...brandHeroSlides,
  ],
  legal: [
    {
      alt: "סצנת שירות ומדיניות בתאורת אקווה רכה",
      src: "/brand/cinematic/cinematic-policy.avif",
    },
    {
      alt: "סצנת תכשיטים עריכתית בגוון Aphrodite Aqua",
      src: "/brand/cinematic/cinematic-editorial.avif",
    },
  ],
  product: [
    {
      alt: "טבעת זהב ויהלומים על קטיפה כהה עם קצה זכוכית אקווה",
      src: "/brand/cinematic/cinematic-product-v2.avif",
    },
    brandHeroSlides[0]!,
  ],
  search: [
    {
      alt: "קטלוג תכשיטים על אבן שחורה וזכוכית אקווה",
      src: "/brand/cinematic/cinematic-catalog-v2.avif",
    },
    {
      alt: "טבעות ויהלומים בסצנת קטגוריה קולנועית",
      src: "/brand/cinematic/cinematic-category-rings.avif",
    },
  ],
  service: [
    {
      alt: "מגש שירות לקוחות עם אריזת תכשיטים ופנינים",
      src: "/brand/cinematic/cinematic-service-v2.avif",
    },
    brandHeroSlides[2]!,
  ],
  stylist: [
    {
      alt: "קטלוג תכשיטים כהה להתאמת סטייליסט אישית",
      src: "/brand/cinematic/cinematic-catalog-v2.avif",
    },
    brandHeroSlides[2]!,
  ],
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
  bracelets: [
    {
      alt: "צמידים וצמידי טניס על זכוכית אקווה",
      src: "/brand/cinematic/cinematic-catalog-v2.avif",
    },
    brandHeroSlides[2]!,
  ],
  earrings: [
    {
      alt: "עגילי פנינה ויהלום על מגש זכוכית אקווה",
      src: "/brand/cinematic/cinematic-service-v2.avif",
    },
    brandHeroSlides[1]!,
  ],
  necklaces: [
    {
      alt: "שרשראות ופנינים על אבן כהה וזכוכית אקווה",
      src: "/brand/cinematic/cinematic-catalog-v2.avif",
    },
    brandHeroSlides[1]!,
  ],
  rings: [
    {
      alt: "טבעת זהב ויהלומים בתאורת אקווה כהה",
      src: "/brand/cinematic/cinematic-product-v2.avif",
    },
    brandHeroSlides[0]!,
  ],
} satisfies Record<string, CinematicHeroSlide[]>;

export type CinematicRouteMediaKey = keyof typeof cinematicRouteMedia;

export function getCinematicRouteSlides(key: CinematicRouteMediaKey) {
  return cinematicRouteMedia[key] ?? cinematicRouteMedia.home;
}

export function getCategoryBrandSlides(slug: string) {
  return categorySlides[slug as keyof typeof categorySlides] ?? brandHeroSlides;
}
