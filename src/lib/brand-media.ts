import type { CinematicHeroSlide } from "~/components/cinematic-hero-sequence";

export const brandHeroSlides = [
  {
    alt: "Diamond rings on an Aphrodite Aqua studio surface",
    src: "/brand/aphrodite-aqua-hero-rings.png",
  },
  {
    alt: "Pearl jewelry on turquoise glass",
    src: "/brand/aphrodite-aqua-hero-pearls.png",
  },
  {
    alt: "Diamond jewelry and glass in aqua studio light",
    src: "/brand/aphrodite-aqua-hero-glass.png",
  },
] satisfies CinematicHeroSlide[];

export const cinematicRouteMedia = {
  accessibility: [
    {
      alt: "Soft editorial aqua and pearl jewelry scene for accessibility information",
      src: "/brand/cinematic/cinematic-editorial.png",
    },
    {
      alt: "Subtle aqua glass and pearl jewelry scene",
      src: "/brand/cinematic/cinematic-policy.png",
    },
  ],
  account: [
    {
      alt: "Cinematic aqua and pearl service jewelry tray for customer account",
      src: "/brand/cinematic/cinematic-service.png",
    },
    brandHeroSlides[2]!,
  ],
  ai: [
    {
      alt: "Cinematic digital aqua and pearl jewelry scene for AI styling",
      src: "/brand/cinematic/cinematic-ai.png",
    },
    brandHeroSlides[2]!,
  ],
  about: [
    {
      alt: "Cinematic Aphrodite Aqua editorial jewelry scene",
      src: "/brand/cinematic/cinematic-editorial.png",
    },
    brandHeroSlides[1]!,
  ],
  branches: [
    {
      alt: "Cinematic luxury jewelry boutique service scene",
      src: "/brand/cinematic/cinematic-branches.png",
    },
    brandHeroSlides[0]!,
  ],
  checkout: [
    {
      alt: "Cinematic jewelry service tray for checkout and delivery",
      src: "/brand/cinematic/cinematic-service.png",
    },
    brandHeroSlides[2]!,
  ],
  faq: [
    {
      alt: "Soft cinematic aqua and pearl jewelry information scene",
      src: "/brand/cinematic/cinematic-policy.png",
    },
    {
      alt: "Editorial Aphrodite Aqua jewelry scene",
      src: "/brand/cinematic/cinematic-editorial.png",
    },
  ],
  gifts: [
    {
      alt: "Cinematic jewelry gift scene on aqua lacquer",
      src: "/brand/cinematic/cinematic-gifts.png",
    },
    brandHeroSlides[1]!,
  ],
  home: [
    {
      alt: "Cinematic luxury jewelry scene in aqua and studio light",
      src: "/brand/cinematic/cinematic-home.png",
    },
    ...brandHeroSlides,
  ],
  legal: [
    {
      alt: "Cinematic policy and service jewelry scene in soft aqua light",
      src: "/brand/cinematic/cinematic-policy.png",
    },
    {
      alt: "Editorial Aphrodite Aqua jewelry scene",
      src: "/brand/cinematic/cinematic-editorial.png",
    },
  ],
  product: [
    {
      alt: "Cinematic product jewelry scene in aqua and studio light",
      src: "/brand/cinematic/cinematic-product.png",
    },
    brandHeroSlides[0]!,
  ],
  search: [
    {
      alt: "Cinematic jewelry catalog search scene",
      src: "/brand/cinematic/cinematic-search.png",
    },
    {
      alt: "Cinematic rings and diamonds category scene",
      src: "/brand/cinematic/cinematic-category-rings.png",
    },
  ],
  service: [
    {
      alt: "Cinematic customer service jewelry tray",
      src: "/brand/cinematic/cinematic-service.png",
    },
    brandHeroSlides[2]!,
  ],
  stylist: [
    {
      alt: "Cinematic digital-light jewelry scene for stylist chat",
      src: "/brand/cinematic/cinematic-ai.png",
    },
    brandHeroSlides[2]!,
  ],
} satisfies Record<string, CinematicHeroSlide[]>;

export const brandMedia = {
  about: cinematicRouteMedia.about,
  ai: cinematicRouteMedia.ai,
  branches: cinematicRouteMedia.branches,
  gifts: cinematicRouteMedia.gifts,
  policy: cinematicRouteMedia.legal,
  search: cinematicRouteMedia.search,
  service: cinematicRouteMedia.service,
} satisfies Record<string, CinematicHeroSlide[]>;

const categorySlides = {
  bracelets: [
    {
      alt: "Cinematic bracelets and tennis bracelets on aqua glass",
      src: "/brand/cinematic/cinematic-category-bracelets.png",
    },
    brandHeroSlides[2]!,
  ],
  earrings: [
    {
      alt: "Cinematic earrings with pearls and diamonds on aqua glass",
      src: "/brand/cinematic/cinematic-category-earrings.png",
    },
    brandHeroSlides[1]!,
  ],
  necklaces: [
    {
      alt: "Cinematic necklaces with pearl accents on aqua glass",
      src: "/brand/cinematic/cinematic-category-necklaces.png",
    },
    brandHeroSlides[1]!,
  ],
  rings: [
    {
      alt: "Cinematic diamond rings on Aphrodite Aqua lacquer",
      src: "/brand/cinematic/cinematic-category-rings.png",
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
