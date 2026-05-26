import type { CinematicHeroSlide } from "~/components/cinematic-hero-sequence";

export const brandHeroSlides = [
  {
    alt: "טבעות יהלום על משטח אקווה נקי",
    src: "/brand/v2/hero-rings.avif",
  },
  {
    alt: "תכשיטי פנינה על זכוכית טורקיז",
    src: "/brand/v2/hero-pearls.avif",
  },
  {
    alt: "תכשיטי יהלום וזכוכית בתאורת אקווה רכה",
    src: "/brand/v2/hero-glass.avif",
  },
] satisfies CinematicHeroSlide[];

export const cinematicRouteMedia = {
  accessibility: [
    {
      alt: "סצנת תכשיטי פנינה רכה למידע נגישות",
      src: "/brand/v2/content-editorial.avif",
    },
    {
      alt: "זכוכית אקווה ותכשיטי פנינה בעיצוב שקט",
      src: "/brand/v2/content-policy.avif",
    },
  ],
  account: [
    {
      alt: "מגש שירות תכשיטים עם פנינים וזכוכית אקווה לאזור אישי",
      src: "/brand/v2/service-task.avif",
    },
    brandHeroSlides[2]!,
  ],
  ai: [
    {
      alt: "תכשיטים על מגש זכוכית אקווה להתאמה אישית",
      src: "/brand/v2/commerce-catalog.avif",
    },
    brandHeroSlides[2]!,
  ],
  about: [
    {
      alt: "סצנת תכשיטים עריכתית בגוון Elysia Aqua",
      src: "/brand/v2/content-editorial.avif",
    },
    brandHeroSlides[1]!,
  ],
  checkout: [
    {
      alt: "מגש אריזה ושירות לסיכום בחירה ומסירת תכשיטים",
      src: "/brand/v2/service-task.avif",
    },
    brandHeroSlides[2]!,
  ],
  faq: [
    {
      alt: "סצנת מידע רכה עם זכוכית אקווה ופנינים",
      src: "/brand/v2/content-policy.avif",
    },
    {
      alt: "סצנת תכשיטים עריכתית בגוון Elysia Aqua",
      src: "/brand/v2/content-editorial.avif",
    },
  ],
  gifts: [
    {
      alt: "תכשיטי מתנה על מגש זכוכית אקווה ומשטח אבן כהה",
      src: "/brand/v2/commerce-gifts.avif",
    },
    brandHeroSlides[1]!,
  ],
  home: [
    {
      alt: "תכשיטים באור אקווה רך",
      src: "/brand/v2/editorial-home.avif",
    },
    ...brandHeroSlides,
  ],
  legal: [
    {
      alt: "סצנת שירות ומדיניות בתאורת אקווה רכה",
      src: "/brand/v2/content-policy.avif",
    },
    {
      alt: "סצנת תכשיטים עריכתית בגוון Elysia Aqua",
      src: "/brand/v2/content-editorial.avif",
    },
  ],
  product: [
    {
      alt: "טבעת זהב ויהלומים על קטיפה כהה עם קצה זכוכית אקווה",
      src: "/brand/v2/product-focus.avif",
    },
    brandHeroSlides[0]!,
  ],
  search: [
    {
      alt: "מבחר תכשיטים על אבן שחורה וזכוכית אקווה",
      src: "/brand/v2/commerce-search.avif",
    },
    {
      alt: "טבעות ויהלומים בסצנת משפחת תכשיטים קולנועית",
      src: "/brand/v2/category-rings.avif",
    },
  ],
  service: [
    {
      alt: "מגש שירות אישי עם אריזת תכשיטים ופנינים",
      src: "/brand/v2/service-task.avif",
    },
    brandHeroSlides[2]!,
  ],
  stylist: [
    {
      alt: "מבחר תכשיטים כהה להתאמת סטייליסט אישית",
      src: "/brand/v2/commerce-catalog.avif",
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
      src: "/brand/v2/category-bracelets.avif",
    },
    brandHeroSlides[2]!,
  ],
  earrings: [
    {
      alt: "עגילי פנינה ויהלום על מגש זכוכית אקווה",
      src: "/brand/v2/category-earrings.avif",
    },
    brandHeroSlides[1]!,
  ],
  necklaces: [
    {
      alt: "שרשראות ופנינים על אבן כהה וזכוכית אקווה",
      src: "/brand/v2/category-necklaces.avif",
    },
    brandHeroSlides[1]!,
  ],
  rings: [
    {
      alt: "טבעת זהב ויהלומים בתאורת אקווה כהה",
      src: "/brand/v2/category-rings.avif",
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
