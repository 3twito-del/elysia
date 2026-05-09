import type { CinematicHeroSlide } from "~/components/cinematic-hero-sequence";

export const brandHeroSlides = [
  {
    alt: "Gold and diamond rings on an Aphrodite Aqua studio surface",
    src: "/brand/aphrodite-aqua-hero-rings.png",
  },
  {
    alt: "Pearls and gold jewelry on turquoise glass",
    src: "/brand/aphrodite-aqua-hero-pearls.png",
  },
  {
    alt: "Diamond jewelry and glass in aqua and champagne studio light",
    src: "/brand/aphrodite-aqua-hero-glass.png",
  },
] satisfies CinematicHeroSlide[];

export const brandMedia = {
  about: [
    {
      alt: "Aqua glass wave with gold jewelry and pearls",
      src: "/brand/aphrodite-aqua-about.png",
    },
    brandHeroSlides[1]!,
  ],
  ai: [
    {
      alt: "Aqua glass jewelry scene with champagne AI light paths",
      src: "/brand/aphrodite-aqua-ai.png",
    },
    brandHeroSlides[2]!,
  ],
  branches: [
    {
      alt: "Luxury jewelry boutique counter with aqua glass accents",
      src: "/brand/aphrodite-aqua-branches.png",
    },
    brandHeroSlides[0]!,
  ],
  gifts: [
    {
      alt: "Jewelry gift tray on an Aphrodite Aqua lacquer surface",
      src: "/brand/aphrodite-aqua-gifts.png",
    },
    brandHeroSlides[1]!,
  ],
  policy: [
    {
      alt: "Subtle aqua glass texture with champagne gold accents",
      src: "/brand/aphrodite-aqua-policy.png",
    },
  ],
  search: [
    {
      alt: "Aphrodite Aqua rings and diamonds for catalog search",
      src: "/brand/aphrodite-aqua-category-rings.png",
    },
    {
      alt: "Aphrodite Aqua necklaces and pearls for catalog search",
      src: "/brand/aphrodite-aqua-category-necklaces.png",
    },
  ],
  service: [
    {
      alt: "Organized luxury jewelry service tray on aqua lacquer",
      src: "/brand/aphrodite-aqua-service.png",
    },
    brandHeroSlides[2]!,
  ],
} satisfies Record<string, CinematicHeroSlide[]>;

const categorySlides = {
  bracelets: [
    {
      alt: "Gold bracelets and tennis bracelets on aqua glass",
      src: "/brand/aphrodite-aqua-category-bracelets.png",
    },
    brandHeroSlides[2]!,
  ],
  earrings: [
    {
      alt: "Gold earrings with pearls and diamonds on aqua glass",
      src: "/brand/aphrodite-aqua-category-earrings.png",
    },
    brandHeroSlides[1]!,
  ],
  necklaces: [
    {
      alt: "Gold necklaces with pearl accents on aqua glass",
      src: "/brand/aphrodite-aqua-category-necklaces.png",
    },
    brandHeroSlides[1]!,
  ],
  rings: [
    {
      alt: "Gold and diamond rings on Aphrodite Aqua lacquer",
      src: "/brand/aphrodite-aqua-category-rings.png",
    },
    brandHeroSlides[0]!,
  ],
} satisfies Record<string, CinematicHeroSlide[]>;

export function getCategoryBrandSlides(slug: string) {
  return categorySlides[slug as keyof typeof categorySlides] ?? brandHeroSlides;
}
