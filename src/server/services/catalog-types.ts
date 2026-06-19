import type { PublicProductAvailabilityMode } from "~/lib/commerce-labels";

export type CatalogCategory = {
  slug: string;
  name: string;
  description: string;
  image: string;
  imageUrl: string;
};

export type CatalogBranch = {
  slug: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  whatsapp: string;
  services: string[];
  openingHours: {
    sundayThursday: string;
    friday: string;
    saturday: string;
  };
};

export type CatalogProductVariant = {
  sku: string;
  name: string;
  separateCheckoutAvailable?: boolean;
  size?: string;
  metalColor?: string;
  stoneColor?: string;
  price: number;
  inventory: Record<string, number>;
  availableQuantity: number;
  availableBranchCount: number;
};

export type CatalogProduct = {
  slug: string;
  sku: string;
  requiresSeparateCheckout: boolean;
  name: string;
  categorySlug: string;
  categoryName: string;
  shortDescription: string;
  description: string;
  availabilityMode: PublicProductAvailabilityMode;
  commerceHighlights: string[];
  deliveryPromise?: string;
  returnPolicy?: string;
  careInstructions?: string;
  warranty?: string;
  verifiedSpecifications?: {
    countryOfManufacture: string;
    manufacturerOrImporter: string;
    materialDetails: string;
    measurements: string;
    stoneDetails?: string;
  };
  price: number;
  compareAt?: number;
  createdAt: Date | string;
  popularityScore: number;
  material: string;
  stone?: string;
  collection: string;
  collections: string[];
  image: string;
  images: string[];
  variants: CatalogProductVariant[];
  metalColors: string[];
  sizes: string[];
  tags: string[];
  inventory: Record<string, number>;
};

export type CatalogSearchInput = {
  query?: string;
  category?: string;
  branch?: string;
  material?: string;
  stone?: string;
  style?: string;
  gift?: string;
  color?: string;
  maxPrice?: number;
  collection?: string;
  availableOnly?: boolean;
};

export type CatalogFacets = {
  materials: string[];
  stones: string[];
  collections: string[];
  styles: string[];
  giftTags: string[];
  colors: string[];
  priceRange: {
    min: number;
    max: number;
  };
};
